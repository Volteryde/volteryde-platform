// ============================================================================
// Supply Service (Driver Tracker)
// ============================================================================
// Austin: WebSocket gateway for real-time driver GPS updates
// Ingests GPS, applies Kalman filtering, updates H3 spatial index
// Reference: Architecture Spec Section 7.1 - Supply Service

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  GeoCoordinate,
  H3IndexedDriver,
  DriverState,
  FilteredGPSUpdate,
} from './h3.types';
import { GEOFENCE_CONFIG } from './h3.constants';
import { H3Service } from './h3.service';
import { RedisH3SpatialService } from './redis-h3-spatial.service';
import { DriverStateMachineService } from './driver-state-machine.service';

/**
 * Austin: GPS update from driver app
 */
interface DriverGPSUpdate {
  driverId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy: number; // GPS accuracy in meters
  heading?: number;
  speed?: number; // km/h
  timestamp: number;
  tripId?: string;
}

/**
 * Austin: Driver online/offline event
 */
interface DriverStatusEvent {
  driverId: string;
  vehicleId: string;
  status: 'online' | 'offline';
  latitude?: number;
  longitude?: number;
}

/**
 * Austin: Dispatch notification to driver
 */
interface DispatchNotification {
  tripId: string;
  riderId: string;
  pickupStopId: string;
  pickupStopName: string;
  pickupLocation: GeoCoordinate;
  estimatedFare: number;
  riderName?: string;
}

/**
 * Austin: Driver response to dispatch
 */
interface DispatchResponse {
  driverId: string;
  tripId: string;
  accepted: boolean;
  reason?: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/driver-supply',
  cors: {
    origin: '*', // Configure properly in production
  },
})
export class SupplyService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(SupplyService.name);

  // Austin: Track socket connections per driver
  private driverSockets = new Map<string, string>(); // driverId -> socketId
  private socketDrivers = new Map<string, string>(); // socketId -> driverId

  // Austin: Track last GPS update time for stale detection
  private lastUpdateTimes = new Map<string, number>();

  // Austin: Stale driver timeout (3x GPS interval)
  private readonly STALE_TIMEOUT_MS = GEOFENCE_CONFIG.EXPECTED_GPS_INTERVAL_MS * 3;

  constructor(
    private readonly h3Service: H3Service,
    private readonly redisH3Spatial: RedisH3SpatialService,
    private readonly driverStateMachine: DriverStateMachineService,
  ) { }

  afterInit(): void {
    this.logger.log('Supply Service WebSocket Gateway initialized');

    // Start stale driver cleanup interval
    setInterval(() => this.cleanupStaleDrivers(), this.STALE_TIMEOUT_MS);
  }

  // ============================================================================
  // Connection Lifecycle
  // ============================================================================

  handleConnection(client: Socket): void {
    this.logger.debug(`Driver socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    const driverId = this.socketDrivers.get(client.id);
    if (driverId) {
      this.handleDriverDisconnect(driverId);
    }
    this.socketDrivers.delete(client.id);
    this.logger.debug(`Driver socket disconnected: ${client.id}`);
  }

  /**
   * Austin: Handle driver disconnection - mark as offline if connected
   */
  private async handleDriverDisconnect(driverId: string): Promise<void> {
    this.driverSockets.delete(driverId);
    this.lastUpdateTimes.delete(driverId);
    this.h3Service.resetGPSFilter(driverId);

    await this.driverStateMachine.goOffline(driverId);
    this.logger.log(`Driver ${driverId} disconnected and marked offline`);
  }

  // ============================================================================
  // Driver Status Events (Online/Offline)
  // ============================================================================

  @SubscribeMessage('driver:status')
  async handleDriverStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() event: DriverStatusEvent,
  ): Promise<{ success: boolean; error?: string }> {
    const { driverId, vehicleId, status } = event;

    if (status === 'online') {
      // Register socket mapping
      this.driverSockets.set(driverId, client.id);
      this.socketDrivers.set(client.id, driverId);

      // Initialize driver in supply pool
      const result = await this.driverStateMachine.goOnline(driverId);

      if (result.success && event.latitude && event.longitude) {
        // Process initial position
        await this.processGPSUpdate({
          driverId,
          vehicleId,
          latitude: event.latitude,
          longitude: event.longitude,
          accuracy: 10,
          timestamp: Date.now(),
        });
      }

      this.logger.log(`Driver ${driverId} came online`);
      return result;
    } else {
      // Driver going offline
      const result = await this.driverStateMachine.goOffline(driverId);
      this.driverSockets.delete(driverId);
      this.socketDrivers.delete(client.id);
      this.lastUpdateTimes.delete(driverId);
      this.h3Service.resetGPSFilter(driverId);

      this.logger.log(`Driver ${driverId} went offline`);
      return result;
    }
  }

  // ============================================================================
  // GPS Update Processing
  // ============================================================================

  @SubscribeMessage('driver:location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() update: DriverGPSUpdate,
  ): Promise<{ success: boolean; h3Index?: string }> {
    const driverId = this.socketDrivers.get(client.id);
    if (!driverId || driverId !== update.driverId) {
      return { success: false };
    }

    try {
      const result = await this.processGPSUpdate(update);
      return { success: true, h3Index: result.h3Index };
    } catch (error) {
      this.logger.error(`GPS update error for ${update.driverId}:`, error);
      return { success: false };
    }
  }

  /**
   * Austin: Process GPS update with Kalman filtering and H3 indexing
   */
  private async processGPSUpdate(update: DriverGPSUpdate): Promise<FilteredGPSUpdate> {
    const { driverId, vehicleId, latitude, longitude, accuracy, heading, speed, tripId } = update;

    // Apply Kalman filter for GPS smoothing
    const filtered = this.h3Service.processGPSUpdate(driverId, latitude, longitude, accuracy);

    // Check if position changed significantly
    const wasSmoothed =
      Math.abs(filtered.latitude - latitude) > 0.00001 ||
      Math.abs(filtered.longitude - longitude) > 0.00001;

    // Get current driver state
    const state = await this.redisH3Spatial.getDriverState(driverId) ?? DriverState.IDLE;

    // Build driver entity for Redis update
    const driver: H3IndexedDriver = {
      driverId,
      vehicleId,
      currentLocation: filtered,
      state,
      lastUpdateTime: new Date(),
      heading,
      speed,
      currentTripId: tripId,
      rating: 4.5, // Would be fetched from DB
    };

    // Update Redis spatial index
    await this.redisH3Spatial.updateDriverPosition(driver);

    // Update last update timestamp
    this.lastUpdateTimes.set(driverId, Date.now());

    // Check for arrival if driver is heading to pickup
    if (state === DriverState.HEADING_TO_PICKUP) {
      await this.driverStateMachine.processLocationUpdate(driverId, filtered);
    }

    const result: FilteredGPSUpdate = {
      raw: { latitude, longitude },
      filtered,
      h3Index: filtered.h3Res10,
      accuracy,
      timestamp: new Date(),
      velocityMps: speed ? speed / 3.6 : undefined,
      wasSmoothed,
    };

    return result;
  }

  // ============================================================================
  // Dispatch Communication
  // ============================================================================

  /**
   * Austin: Send dispatch notification to a driver
   */
  async sendDispatchNotification(
    driverId: string,
    notification: DispatchNotification,
  ): Promise<boolean> {
    const socketId = this.driverSockets.get(driverId);
    if (!socketId) {
      this.logger.warn(`Cannot dispatch to ${driverId}: not connected`);
      return false;
    }

    this.server.to(socketId).emit('dispatch:request', notification);
    this.logger.log(`Dispatch notification sent to driver ${driverId} for trip ${notification.tripId}`);
    return true;
  }

  @SubscribeMessage('dispatch:response')
  async handleDispatchResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() response: DispatchResponse,
  ): Promise<{ success: boolean }> {
    const driverId = this.socketDrivers.get(client.id);
    if (!driverId || driverId !== response.driverId) {
      return { success: false };
    }

    if (response.accepted) {
      const result = await this.driverStateMachine.acknowledgeDispatch(driverId);
      if (result.success) {
        this.logger.log(`Driver ${driverId} accepted trip ${response.tripId}`);
      }
      return result;
    } else {
      // Driver rejected - transition back to IDLE
      const result = await this.driverStateMachine.cancelDispatch(driverId, 'driver_cancelled');
      this.logger.log(`Driver ${driverId} rejected trip ${response.tripId}: ${response.reason}`);
      return result;
    }
  }

  // ============================================================================
  // Trip Events
  // ============================================================================

  @SubscribeMessage('trip:start')
  async handleTripStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string; tripId: string },
  ): Promise<{ success: boolean; error?: string }> {
    const driverId = this.socketDrivers.get(client.id);
    if (!driverId || driverId !== data.driverId) {
      return { success: false, error: 'Invalid driver' };
    }

    return this.driverStateMachine.startTrip(driverId);
  }

  @SubscribeMessage('trip:complete')
  async handleTripComplete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string; tripId: string },
  ): Promise<{ success: boolean; error?: string }> {
    const driverId = this.socketDrivers.get(client.id);
    if (!driverId || driverId !== data.driverId) {
      return { success: false, error: 'Invalid driver' };
    }

    return this.driverStateMachine.completeTrip(driverId);
  }

  @SubscribeMessage('trip:eta_update')
  async handleETAUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string; etaSeconds: number },
  ): Promise<{ success: boolean }> {
    const driverId = this.socketDrivers.get(client.id);
    if (!driverId || driverId !== data.driverId) {
      return { success: false };
    }

    // Update dropoff ETA for "Open for Dispatch" logic
    await this.driverStateMachine.updateDropoffETA(driverId, data.etaSeconds);
    return { success: true };
  }

  // ============================================================================
  // Stale Driver Cleanup
  // ============================================================================

  /**
   * Austin: Remove drivers that haven't sent GPS updates recently
   * Prevents stale data in the supply pool
   */
  private async cleanupStaleDrivers(): Promise<void> {
    const now = Date.now();
    const staleDrivers: string[] = [];

    for (const [driverId, lastUpdate] of this.lastUpdateTimes) {
      if (now - lastUpdate > this.STALE_TIMEOUT_MS) {
        staleDrivers.push(driverId);
      }
    }

    for (const driverId of staleDrivers) {
      this.logger.warn(`Driver ${driverId} is stale, removing from supply`);

      // Remove from supply pool
      await this.driverStateMachine.goOffline(driverId);
      this.lastUpdateTimes.delete(driverId);
      this.h3Service.resetGPSFilter(driverId);

      // Disconnect socket if still connected
      const socketId = this.driverSockets.get(driverId);
      if (socketId) {
        this.server.sockets.sockets.get(socketId)?.disconnect(true);
        this.driverSockets.delete(driverId);
        this.socketDrivers.delete(socketId);
      }
    }

    if (staleDrivers.length > 0) {
      this.logger.log(`Cleaned up ${staleDrivers.length} stale drivers`);
    }
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Austin: Get count of connected drivers
   */
  getConnectedDriverCount(): number {
    return this.driverSockets.size;
  }

  /**
   * Austin: Check if a specific driver is connected
   */
  isDriverConnected(driverId: string): boolean {
    return this.driverSockets.has(driverId);
  }

  /**
   * Austin: Broadcast message to all connected drivers in a region
   */
  async broadcastToRegion(h3Index: string, event: string, data: unknown): Promise<number> {
    const driversInRegion = await this.redisH3Spatial.findAvailableDriversNear(
      ...Object.values(this.h3Service.getCoordinateFromH3(h3Index)) as [number, number],
      2,
    );

    let count = 0;
    for (const driver of driversInRegion) {
      const socketId = this.driverSockets.get(driver.driverId);
      if (socketId) {
        this.server.to(socketId).emit(event, data);
        count++;
      }
    }

    return count;
  }
}
