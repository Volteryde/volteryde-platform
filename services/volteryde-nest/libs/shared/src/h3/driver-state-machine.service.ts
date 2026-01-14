// ============================================================================
// Driver State Machine Service
// ============================================================================
// Austin: Finite State Machine (FSM) for driver lifecycle management
// Enforces strict state transitions to prevent race conditions
// Implements "Heading to Pickup" and "Open for Dispatch" logic from spec

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  DriverState,
  VALID_DRIVER_STATE_TRANSITIONS,
  GeoCoordinate,
} from './h3.types';
import { DRIVER_STATE_TIMEOUTS, GEOFENCE_CONFIG } from './h3.constants';
import { RedisH3SpatialService } from './redis-h3-spatial.service';
import { H3Service } from './h3.service';

/**
 * Austin: State transition event payload
 */
export interface DriverStateTransitionEvent {
  driverId: string;
  previousState: DriverState;
  newState: DriverState;
  tripId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Austin: Dispatch assignment payload
 */
export interface DispatchAssignment {
  driverId: string;
  tripId: string;
  pickupStopId: string;
  pickupLocation: GeoCoordinate;
  pickupH3Index: string;
  riderId: string;
  estimatedPickupTimeSeconds: number;
}

/**
 * Austin: Arrival check result
 */
interface ArrivalCheckResult {
  isArrived: boolean;
  consecutiveCount: number;
  distanceMeters?: number;
}

@Injectable()
export class DriverStateMachineService extends EventEmitter {
  private readonly logger = new Logger(DriverStateMachineService.name);

  // Austin: Track consecutive geofence hits for hysteresis
  private arrivalCounters = new Map<string, number>();

  // Austin: Track dispatch timeout timers
  private dispatchTimeouts = new Map<string, NodeJS.Timeout>();

  // Austin: Track ETA to dropoff for "Open for Dispatch" logic
  private dropoffETAs = new Map<string, { eta: number; updatedAt: number }>();

  constructor(
    private readonly redisH3Spatial: RedisH3SpatialService,
    private readonly h3Service: H3Service,
  ) {
    super();
  }

  // ============================================================================
  // State Transition Operations
  // ============================================================================

  /**
   * Austin: Transition driver to a new state with validation
   * Emits events for downstream consumers (notifications, analytics, etc.)
   */
  async transitionState(
    driverId: string,
    newState: DriverState,
    tripId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> {
    const currentState = await this.redisH3Spatial.getDriverState(driverId);

    if (!currentState) {
      // Driver not in system - allow only IDLE (coming online)
      if (newState !== DriverState.IDLE) {
        return { success: false, error: 'Driver not found. Must go IDLE first.' };
      }
    } else {
      // Validate transition
      const validation = this.h3Service.validateStateTransition(currentState, newState);
      if (!validation.valid) {
        this.logger.warn(
          `Invalid state transition for driver ${driverId}: ${validation.reason}`,
        );
        return { success: false, error: validation.reason };
      }
    }

    // Austin: Clear any existing timeouts for this driver
    this.clearDriverTimeouts(driverId);

    // Persist new state
    await this.redisH3Spatial.updateDriverState(driverId, newState);

    // Emit state transition event
    const event: DriverStateTransitionEvent = {
      driverId,
      previousState: currentState ?? DriverState.OFFLINE,
      newState,
      tripId,
      timestamp: new Date(),
      metadata,
    };
    this.emit('driver.state.changed', event);

    this.logger.log(
      `Driver ${driverId} transitioned: ${currentState ?? 'OFFLINE'} → ${newState}`,
    );

    // Austin: Set up state-specific timers
    await this.setupStateTimers(driverId, newState, tripId);

    return { success: true };
  }

  /**
   * Austin: Driver goes online and enters supply pool
   */
  async goOnline(driverId: string): Promise<{ success: boolean; error?: string }> {
    return this.transitionState(driverId, DriverState.IDLE);
  }

  /**
   * Austin: Driver goes offline and exits supply pool
   */
  async goOffline(driverId: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.transitionState(driverId, DriverState.OFFLINE);
    if (result.success) {
      await this.redisH3Spatial.removeDriverFromSupply(driverId);
    }
    return result;
  }

  // ============================================================================
  // Dispatch Operations
  // ============================================================================

  /**
   * Austin: Assign a trip to a driver (dispatch)
   * Locks the driver and starts acknowledgment timer
   */
  async dispatchDriver(assignment: DispatchAssignment): Promise<{ success: boolean; error?: string }> {
    const { driverId, tripId, pickupH3Index } = assignment;

    // Verify driver is available
    const state = await this.redisH3Spatial.getDriverState(driverId);
    if (!this.h3Service.isDriverDispatchable(state!)) {
      return { success: false, error: `Driver not available. Current state: ${state}` };
    }

    // Transition to DISPATCHED
    const result = await this.transitionState(driverId, DriverState.DISPATCHED, tripId, {
      pickupStopId: assignment.pickupStopId,
      pickupH3Index,
      riderId: assignment.riderId,
    });

    if (result.success) {
      // Austin: Store pickup target for arrival detection
      await this.setPickupTarget(driverId, pickupH3Index);

      // Start dispatch acknowledgment timeout
      const timeout = setTimeout(async () => {
        const currentState = await this.redisH3Spatial.getDriverState(driverId);
        if (currentState === DriverState.DISPATCHED) {
          this.logger.warn(`Driver ${driverId} failed to acknowledge dispatch, reverting`);
          await this.transitionState(driverId, DriverState.IDLE, undefined, {
            reason: 'dispatch_timeout',
          });
          this.emit('driver.dispatch.timeout', { driverId, tripId });
        }
      }, DRIVER_STATE_TIMEOUTS.DISPATCH_ACK_TIMEOUT_MS);

      this.dispatchTimeouts.set(`${driverId}:dispatch`, timeout);
    }

    return result;
  }

  /**
   * Austin: Driver acknowledges dispatch and starts heading to pickup
   */
  async acknowledgeDispatch(driverId: string): Promise<{ success: boolean; error?: string }> {
    return this.transitionState(driverId, DriverState.HEADING_TO_PICKUP);
  }

  /**
   * Austin: Cancel a dispatch (rider or driver initiated)
   */
  async cancelDispatch(
    driverId: string,
    reason: 'rider_cancelled' | 'driver_cancelled' | 'no_show',
  ): Promise<{ success: boolean; error?: string }> {
    this.clearDriverTimeouts(driverId);
    await this.clearPickupTarget(driverId);
    this.arrivalCounters.delete(driverId);

    return this.transitionState(driverId, DriverState.IDLE, undefined, { reason });
  }

  // ============================================================================
  // Arrival Detection (H3 Geofence with Hysteresis)
  // ============================================================================

  /**
   * Austin: Process GPS update and check for arrival at pickup
   * Uses hysteresis to prevent GPS flickering
   */
  async processLocationUpdate(
    driverId: string,
    location: GeoCoordinate,
  ): Promise<ArrivalCheckResult> {
    const state = await this.redisH3Spatial.getDriverState(driverId);

    // Only check arrival for drivers heading to pickup
    if (state !== DriverState.HEADING_TO_PICKUP) {
      return { isArrived: false, consecutiveCount: 0 };
    }

    const targetH3 = await this.getPickupTarget(driverId);
    if (!targetH3) {
      return { isArrived: false, consecutiveCount: 0 };
    }

    // Check if driver is in or near target cell
    const isNearTarget = this.h3Service.isInGeofence(location, targetH3, 1);
    const counterKey = `${driverId}:arrival`;

    if (isNearTarget) {
      const count = (this.arrivalCounters.get(counterKey) ?? 0) + 1;
      this.arrivalCounters.set(counterKey, count);

      // Austin: Require consecutive hits to confirm arrival (hysteresis)
      if (count >= GEOFENCE_CONFIG.ARRIVAL_HYSTERESIS_COUNT) {
        await this.transitionState(driverId, DriverState.ARRIVED);
        this.arrivalCounters.delete(counterKey);
        return { isArrived: true, consecutiveCount: count };
      }

      return { isArrived: false, consecutiveCount: count };
    } else {
      // Reset counter if driver moves away from target
      this.arrivalCounters.set(counterKey, 0);
      return { isArrived: false, consecutiveCount: 0 };
    }
  }

  // ============================================================================
  // Trip Operations
  // ============================================================================

  /**
   * Austin: Start trip (passenger on board)
   */
  async startTrip(driverId: string): Promise<{ success: boolean; error?: string }> {
    await this.clearPickupTarget(driverId);
    return this.transitionState(driverId, DriverState.POB);
  }

  /**
   * Austin: Complete trip
   */
  async completeTrip(driverId: string): Promise<{ success: boolean; error?: string }> {
    this.dropoffETAs.delete(driverId);
    return this.transitionState(driverId, DriverState.IDLE);
  }

  // ============================================================================
  // "Open for Dispatch" Logic (Ride Chaining)
  // ============================================================================

  /**
   * Austin: Update ETA to dropoff for "Open for Dispatch" logic
   * When driver is POB and < 2 mins from dropoff, they become eligible for chaining
   */
  async updateDropoffETA(driverId: string, etaSeconds: number): Promise<void> {
    const state = await this.redisH3Spatial.getDriverState(driverId);

    if (state !== DriverState.POB) {
      return;
    }

    this.dropoffETAs.set(driverId, { eta: etaSeconds, updatedAt: Date.now() });

    // Austin: Check if eligible for "Open for Dispatch"
    const thresholdSeconds = DRIVER_STATE_TIMEOUTS.OPEN_FOR_DISPATCH_THRESHOLD_MS / 1000;

    if (etaSeconds <= thresholdSeconds) {
      this.logger.log(
        `Driver ${driverId} eligible for chained dispatch (ETA: ${etaSeconds}s)`,
      );
      await this.transitionState(driverId, DriverState.OPEN_FOR_DISPATCH);
    }
  }

  /**
   * Austin: Check if driver is eligible for chained dispatch
   */
  async isEligibleForChainedDispatch(driverId: string): Promise<boolean> {
    const state = await this.redisH3Spatial.getDriverState(driverId);
    return state === DriverState.OPEN_FOR_DISPATCH;
  }

  /**
   * Austin: Get estimated dropoff location for chained dispatch
   * Used to pre-position driver in supply pool at future location
   */
  getDropoffETAInfo(driverId: string): { eta: number; updatedAt: number } | null {
    return this.dropoffETAs.get(driverId) ?? null;
  }

  // ============================================================================
  // Pickup Target Management (for arrival detection)
  // ============================================================================

  private async setPickupTarget(driverId: string, h3Index: string): Promise<void> {
    // Store in Redis for persistence across restarts
    // Using a simple key pattern for now
    // In production, this would be part of the trip state
    this.logger.debug(`Set pickup target for ${driverId}: ${h3Index}`);
    // TODO: Store in Redis
  }

  private async getPickupTarget(driverId: string): Promise<string | null> {
    // TODO: Retrieve from Redis
    // For now, return null - would need trip context
    return null;
  }

  private async clearPickupTarget(driverId: string): Promise<void> {
    // TODO: Clear from Redis
    this.logger.debug(`Cleared pickup target for ${driverId}`);
  }

  // ============================================================================
  // Timer Management
  // ============================================================================

  private clearDriverTimeouts(driverId: string): void {
    // Clear all timeouts for this driver
    for (const [key, timeout] of this.dispatchTimeouts) {
      if (key.startsWith(driverId)) {
        clearTimeout(timeout);
        this.dispatchTimeouts.delete(key);
      }
    }
  }

  private async setupStateTimers(
    driverId: string,
    state: DriverState,
    tripId?: string,
  ): Promise<void> {
    switch (state) {
      case DriverState.ARRIVED:
        // Austin: Set timeout for no-show handling
        const noShowTimeout = setTimeout(async () => {
          const currentState = await this.redisH3Spatial.getDriverState(driverId);
          if (currentState === DriverState.ARRIVED) {
            this.logger.warn(`No-show timeout for driver ${driverId}`);
            this.emit('trip.no_show', { driverId, tripId });
          }
        }, DRIVER_STATE_TIMEOUTS.MAX_WAIT_AT_PICKUP_MS);

        this.dispatchTimeouts.set(`${driverId}:noshow`, noShowTimeout);
        break;

      default:
        // No timers needed for other states
        break;
    }
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Austin: Get driver's current state
   */
  async getDriverState(driverId: string): Promise<DriverState | null> {
    return this.redisH3Spatial.getDriverState(driverId);
  }

  /**
   * Austin: Check if driver can be dispatched
   */
  async canDispatch(driverId: string): Promise<boolean> {
    const state = await this.redisH3Spatial.getDriverState(driverId);
    return state ? this.h3Service.isDriverDispatchable(state) : false;
  }

  /**
   * Austin: Get all valid transitions from current state
   */
  getValidTransitions(currentState: DriverState): DriverState[] {
    return VALID_DRIVER_STATE_TRANSITIONS[currentState] ?? [];
  }
}
