// ============================================================================
// H3 Geospatial Service
// ============================================================================
// Austin: NestJS injectable service for H3 spatial operations
// Wraps pure utility functions for dependency injection and adds business logic
// This is the primary interface for all geospatial queries in VolteRyde

import { Injectable, Logger } from '@nestjs/common';
import {
  H3Resolution,
  K_RING_DEFAULTS,
  GEOFENCE_CONFIG,
  WALKING_ASSUMPTIONS,
} from './h3.constants';
import {
  GeoCoordinate,
  H3IndexedCoordinate,
  H3IndexedStop,
  StopCandidate,
  SmartSnapResult,
  KRingSearchResult,
  DriverState,
  VALID_DRIVER_STATE_TRANSITIONS,
} from './h3.types';
import {
  latLngToH3,
  h3ToLatLng,
  getMultiResolutionH3Indices,
  getKRingCells,
  getRingAtDistance,
  haversineDistanceMeters,
  estimateWalkingTimeSeconds,
  isCoordinateNearCell,
  getParentCell,
  getKRingRadiusMeters,
  SimpleKalmanFilter,
  isValidH3Index,
  getH3Resolution,
} from './h3.utils';

/**
 * Austin: H3 Service - Core geospatial operations for VolteRyde
 * 
 * Key responsibilities:
 * 1. Coordinate indexing at multiple resolutions
 * 2. Proximity searches using k-ring expansion
 * 3. Smart stop selection with cost optimization
 * 4. Geofence arrival detection with hysteresis
 * 5. Driver state machine validation
 */
@Injectable()
export class H3Service {
  private readonly logger = new Logger(H3Service.name);

  // Austin: Per-driver Kalman filters for GPS smoothing
  private readonly kalmanFilters = new Map<string, SimpleKalmanFilter>();

  // ============================================================================
  // Core Indexing Operations
  // ============================================================================

  /**
   * Austin: Index a coordinate at the primary operating resolution (Res 10)
   * This is the most common operation - O(1) complexity
   */
  indexCoordinate(lat: number, lng: number): string {
    return latLngToH3(lat, lng, H3Resolution.PICKUP_POINT);
  }

  /**
   * Austin: Get multi-resolution indices for a coordinate
   * Pre-computes Res 6, 8, 10 for caching in entities
   */
  indexCoordinateMultiRes(lat: number, lng: number): H3IndexedCoordinate {
    return getMultiResolutionH3Indices(lat, lng);
  }

  /**
   * Austin: Convert H3 index back to center coordinate
   */
  getCoordinateFromH3(h3Index: string): GeoCoordinate {
    if (!isValidH3Index(h3Index)) {
      throw new Error(`Invalid H3 index: ${h3Index}`);
    }
    return h3ToLatLng(h3Index);
  }

  /**
   * Austin: Get parent cell at coarser resolution
   * Used for hierarchical queries (fine to coarse)
   */
  getParentIndex(h3Index: string, targetResolution: H3Resolution): string {
    const currentRes = getH3Resolution(h3Index);
    if (targetResolution >= currentRes) {
      throw new Error(
        `Target resolution ${targetResolution} must be coarser than current ${currentRes}`,
      );
    }
    return getParentCell(h3Index, targetResolution);
  }

  // ============================================================================
  // Proximity Search Operations
  // ============================================================================

  /**
   * Austin: Get all H3 cells within k rings of a center cell
   * This is the core proximity search - transforms geometric queries to set operations
   * 
   * @param h3Index - Center cell H3 index
   * @param k - Number of rings (default: PICKUP_SEARCH = 2)
   * @returns Array of H3 indices including center + all neighbors within k rings
   */
  getProximityCells(
    h3Index: string,
    k: number = K_RING_DEFAULTS.PICKUP_SEARCH,
  ): string[] {
    return getKRingCells(h3Index, k);
  }

  /**
   * Austin: Get proximity cells from a coordinate directly
   * Convenience method combining indexing + k-ring expansion
   */
  getProximityCellsFromCoordinate(
    lat: number,
    lng: number,
    k: number = K_RING_DEFAULTS.PICKUP_SEARCH,
  ): string[] {
    const centerIndex = this.indexCoordinate(lat, lng);
    return this.getProximityCells(centerIndex, k);
  }

  /**
   * Austin: Incremental expansion search
   * Start with k=1, expand to k=2, k=3... until results found
   * More efficient than always searching with large k
   */
  async getExpandingProximityCells(
    h3Index: string,
    maxK: number = K_RING_DEFAULTS.EXTENDED_SEARCH,
    hasResultsCallback: (cells: string[]) => Promise<boolean>,
  ): Promise<string[]> {
    let allCells: string[] = [h3Index]; // Start with center

    for (let k = 1; k <= maxK; k++) {
      const ringCells = getRingAtDistance(h3Index, k);
      allCells = [...allCells, ...ringCells];

      // Check if we found results in the current expansion
      if (await hasResultsCallback(allCells)) {
        this.logger.debug(`Found results at k=${k}, stopping expansion`);
        return allCells;
      }
    }

    this.logger.debug(`No results found after k=${maxK} expansion`);
    return allCells;
  }

  /**
   * Austin: Get k-ring with metadata for UI display
   */
  getProximitySearchInfo(
    lat: number,
    lng: number,
    k: number,
  ): KRingSearchResult<string> {
    const centerIndex = this.indexCoordinate(lat, lng);
    const cells = this.getProximityCells(centerIndex, k);

    return {
      items: cells,
      searchedCells: cells,
      kValue: k,
      radiusMeters: getKRingRadiusMeters(k),
    };
  }

  // ============================================================================
  // Smart Snap Algorithm - Optimal Stop Selection
  // ============================================================================

  /**
   * Austin: Smart Snap - Find optimal pickup stop for a user
   * 
   * Implements the cost function:
   * Cost = (α × T_walk) + (β × T_drive) + P_safety + P_crowd
   * 
   * @param userLocation - User's current GPS coordinate
   * @param candidates - Candidate stops from H3 k-ring query
   * @param destinationLocation - Final destination (for drive time estimation)
   * @param weights - Optional custom weights for cost function
   */
  calculateSmartSnap(
    userLocation: GeoCoordinate,
    candidates: H3IndexedStop[],
    destinationLocation?: GeoCoordinate,
    weights?: {
      walkingWeight?: number;
      drivingWeight?: number;
      safetyWeight?: number;
      crowdingWeight?: number;
    },
  ): SmartSnapResult | null {
    if (candidates.length === 0) {
      this.logger.warn('No candidates provided for smart snap');
      return null;
    }

    // Austin: Default weights from architecture spec
    const w = {
      walking: weights?.walkingWeight ?? 1.0,
      driving: weights?.drivingWeight ?? 0.8,
      safety: weights?.safetyWeight ?? 1.5,
      crowding: weights?.crowdingWeight ?? 0.5,
    };

    const scoredCandidates: StopCandidate[] = candidates.map((stop) => {
      // Calculate walking distance and time
      const walkingDistance = haversineDistanceMeters(userLocation, stop.location);
      const walkingTime = estimateWalkingTimeSeconds(walkingDistance);

      // Austin: Filter out stops beyond max walking distance
      if (walkingDistance > WALKING_ASSUMPTIONS.MAX_WALKING_DISTANCE_M) {
        return {
          stop,
          walkingTimeSeconds: walkingTime,
          walkingDistanceMeters: walkingDistance,
          safetyPenalty: 0,
          crowdingPenalty: 0,
          totalCost: Infinity, // Exclude from selection
        };
      }

      // Austin: Safety and crowding penalties would come from external data
      // For now, using placeholder values - these should be fetched from DB/Redis
      const safetyPenalty = 0; // TODO: Integrate crime data / intersection safety
      const crowdingPenalty = 0; // TODO: Integrate real-time booking clustering

      // Calculate total cost
      const totalCost =
        w.walking * walkingTime +
        w.safety * safetyPenalty +
        w.crowding * crowdingPenalty;

      return {
        stop,
        walkingTimeSeconds: walkingTime,
        walkingDistanceMeters: walkingDistance,
        safetyPenalty,
        crowdingPenalty,
        totalCost,
      };
    });

    // Sort by cost (ascending)
    scoredCandidates.sort((a, b) => a.totalCost - b.totalCost);

    const optimalCandidate = scoredCandidates[0];

    if (optimalCandidate.totalCost === Infinity) {
      this.logger.warn('All candidates exceed maximum walking distance');
      return null;
    }

    return {
      stop: optimalCandidate.stop,
      walkingTimeSeconds: optimalCandidate.walkingTimeSeconds,
      walkingDistanceMeters: optimalCandidate.walkingDistanceMeters,
      costScore: optimalCandidate.totalCost,
      candidates: scoredCandidates,
    };
  }

  // ============================================================================
  // Geofence and Arrival Detection
  // ============================================================================

  /**
   * Austin: Check if a driver has arrived at a target H3 cell
   * Uses k-ring inclusion rather than simple distance for robustness
   */
  isInGeofence(
    currentLocation: GeoCoordinate,
    targetH3Index: string,
    bufferK: number = 1,
  ): boolean {
    return isCoordinateNearCell(currentLocation, targetH3Index, bufferK);
  }

  /**
   * Austin: Arrival detection with hysteresis
   * Prevents GPS flickering from causing state thrashing
   */
  checkArrivalWithHysteresis(
    driverId: string,
    currentLocation: GeoCoordinate,
    targetH3Index: string,
    consecutiveCount: Map<string, number>,
  ): { isArrived: boolean; count: number } {
    const isNearTarget = this.isInGeofence(currentLocation, targetH3Index, 1);
    const key = `${driverId}:${targetH3Index}`;

    if (isNearTarget) {
      const count = (consecutiveCount.get(key) ?? 0) + 1;
      consecutiveCount.set(key, count);

      return {
        isArrived: count >= GEOFENCE_CONFIG.ARRIVAL_HYSTERESIS_COUNT,
        count,
      };
    } else {
      // Reset counter if driver moves away
      consecutiveCount.delete(key);
      return { isArrived: false, count: 0 };
    }
  }

  // ============================================================================
  // GPS Processing with Kalman Filter
  // ============================================================================

  /**
   * Austin: Process raw GPS update through Kalman filter
   * Reduces jitter for stable H3 indexing
   */
  processGPSUpdate(
    entityId: string,
    rawLat: number,
    rawLng: number,
    accuracy: number,
  ): H3IndexedCoordinate {
    // Get or create Kalman filter for this entity
    let filter = this.kalmanFilters.get(entityId);
    if (!filter) {
      filter = new SimpleKalmanFilter();
      this.kalmanFilters.set(entityId, filter);
    }

    // Apply Kalman smoothing
    const filtered = filter.update(rawLat, rawLng, accuracy);

    // Return indexed coordinate at multiple resolutions
    return getMultiResolutionH3Indices(filtered.latitude, filtered.longitude);
  }

  /**
   * Austin: Reset Kalman filter for an entity (e.g., when driver goes offline)
   */
  resetGPSFilter(entityId: string): void {
    this.kalmanFilters.delete(entityId);
  }

  /**
   * Austin: Cleanup old Kalman filters to prevent memory leaks
   */
  pruneGPSFilters(maxFilters: number = 10000): number {
    if (this.kalmanFilters.size <= maxFilters) {
      return 0;
    }

    // Remove oldest entries (FIFO based on Map insertion order)
    const toRemove = this.kalmanFilters.size - maxFilters;
    const keys = Array.from(this.kalmanFilters.keys()).slice(0, toRemove);
    keys.forEach((key) => this.kalmanFilters.delete(key));

    this.logger.debug(`Pruned ${toRemove} Kalman filters`);
    return toRemove;
  }

  // ============================================================================
  // Driver State Machine Validation
  // ============================================================================

  /**
   * Austin: Validate driver state transition
   * Enforces FSM rules to prevent invalid state changes
   */
  validateStateTransition(
    currentState: DriverState,
    newState: DriverState,
  ): { valid: boolean; reason?: string } {
    const validTransitions = VALID_DRIVER_STATE_TRANSITIONS[currentState];

    if (!validTransitions) {
      return {
        valid: false,
        reason: `Unknown current state: ${currentState}`,
      };
    }

    if (!validTransitions.includes(newState)) {
      return {
        valid: false,
        reason: `Invalid transition from ${currentState} to ${newState}. Valid: [${validTransitions.join(', ')}]`,
      };
    }

    return { valid: true };
  }

  /**
   * Austin: Check if driver is available for dispatch
   */
  isDriverDispatchable(state: DriverState): boolean {
    return state === DriverState.IDLE || state === DriverState.OPEN_FOR_DISPATCH;
  }

  // ============================================================================
  // Distance and Time Calculations
  // ============================================================================

  /**
   * Austin: Calculate Haversine distance between two coordinates
   */
  calculateDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
    return haversineDistanceMeters(coord1, coord2);
  }

  /**
   * Austin: Estimate walking time in seconds
   */
  estimateWalkingTime(distanceMeters: number): number {
    return estimateWalkingTimeSeconds(distanceMeters);
  }

  /**
   * Austin: Calculate walking time between two coordinates
   */
  calculateWalkingTime(from: GeoCoordinate, to: GeoCoordinate): number {
    const distance = this.calculateDistance(from, to);
    return this.estimateWalkingTime(distance);
  }

  // ============================================================================
  // Sharding and Partitioning
  // ============================================================================

  /**
   * Austin: Get shard key for database partitioning
   * Uses Resolution 6 H3 index for city-district level sharding
   */
  getShardKey(lat: number, lng: number): string {
    return latLngToH3(lat, lng, H3Resolution.SHARD);
  }

  /**
   * Austin: Get surge zone key for pricing calculations
   * Uses Resolution 7 H3 index for demand aggregation
   */
  getSurgeZoneKey(lat: number, lng: number): string {
    return latLngToH3(lat, lng, H3Resolution.SURGE_PRICING);
  }
}
