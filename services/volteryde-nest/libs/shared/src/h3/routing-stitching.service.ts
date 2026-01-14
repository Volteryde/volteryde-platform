// ============================================================================
// Routing Stitching Service
// ============================================================================
// Austin: Walk-Drive-Walk multimodal routing engine
// Constructs complete trip routes by chaining Mapbox API requests
// Reference: Architecture Spec Section 4 - Multimodal Routing

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeoCoordinate,
  H3IndexedStop,
  StitchedRoute,
  RouteLeg,
  SmartSnapResult,
} from './h3.types';
import { WALKING_ASSUMPTIONS } from './h3.constants';
import { H3Service } from './h3.service';
import { RedisH3SpatialService } from './redis-h3-spatial.service';
import { DistancePricingService } from './distance-pricing.service';

/**
 * Austin: Mapbox Directions API response types
 */
interface MapboxDirectionsResponse {
  routes: Array<{
    duration: number;
    distance: number;
    geometry: string;
    legs: Array<{
      duration: number;
      distance: number;
      steps: Array<{
        duration: number;
        distance: number;
        name: string;
        maneuver: {
          type: string;
          instruction: string;
          location: [number, number];
        };
      }>;
    }>;
  }>;
  code: string;
  message?: string;
}

/**
 * Austin: Mapbox Matrix API response types
 */
interface MapboxMatrixResponse {
  durations: number[][];
  distances: number[][];
  code: string;
  message?: string;
}

/**
 * Austin: Route request with origin and destination
 */
export interface RouteRequest {
  origin: GeoCoordinate;
  destination: GeoCoordinate;
  departureTime?: Date;
}

@Injectable()
export class RoutingStitchingService {
  private readonly logger = new Logger(RoutingStitchingService.name);
  private readonly mapboxToken: string;
  private readonly mapboxBaseUrl = 'https://api.mapbox.com';

  // Austin: Number of candidate stops to consider for optimization
  private readonly CANDIDATE_STOPS_COUNT = 3;

  constructor(
    private readonly configService: ConfigService,
    private readonly h3Service: H3Service,
    private readonly redisH3Spatial: RedisH3SpatialService,
    // Austin: Distance-based pricing service for fare calculation
    private readonly distancePricingService: DistancePricingService,
  ) {
    this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN', '');
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN not configured - routing will be estimated');
    }
  }

  // ============================================================================
  // Main Stitching Algorithm
  // ============================================================================

  /**
   * Austin: Generate complete stitched route (Walk → Drive → Walk)
   * Implements the algorithm from Architecture Spec Section 4.1
   */
  async generateStitchedRoute(request: RouteRequest): Promise<StitchedRoute> {
    const { origin, destination } = request;

    // Step 1: Find candidate pickup stops (Set A)
    const pickupCandidates = await this.findCandidateStops(origin, this.CANDIDATE_STOPS_COUNT);
    if (pickupCandidates.length === 0) {
      throw new HttpException(
        'No pickup stops found near origin',
        HttpStatus.NOT_FOUND,
      );
    }

    // Step 2: Find candidate dropoff stops (Set B)
    const dropoffCandidates = await this.findCandidateStops(destination, this.CANDIDATE_STOPS_COUNT);
    if (dropoffCandidates.length === 0) {
      throw new HttpException(
        'No dropoff stops found near destination',
        HttpStatus.NOT_FOUND,
      );
    }

    // Step 3: Optimize stop selection using many-to-many matrix
    const { pickupStop, dropoffStop, driveTimeSeconds } = await this.optimizeStopSelection(
      origin,
      destination,
      pickupCandidates,
      dropoffCandidates,
    );

    // Step 4: Generate individual route legs
    const [leg1Walk, leg2Drive, leg3Walk] = await Promise.all([
      this.generateWalkingLeg(origin, pickupStop.location),
      this.generateDrivingLeg(pickupStop.location, dropoffStop.location),
      this.generateWalkingLeg(dropoffStop.location, destination),
    ]);

    // Step 5: Calculate total time and fare
    // Austin: Use distance-based pricing service (not time-based)
    const totalTimeSeconds = leg1Walk.durationSeconds + leg2Drive.durationSeconds + leg3Walk.durationSeconds;
    const totalDistanceMeters = leg1Walk.distanceMeters + leg2Drive.distanceMeters + leg3Walk.distanceMeters;
    const fareBreakdown = this.distancePricingService.calculateFareWithRouteDistance(
      pickupStop.location,
      dropoffStop.location,
      leg2Drive.distanceMeters,
    );
    const estimatedFare = fareBreakdown.totalFare;

    return {
      leg1Walk,
      leg2Drive,
      leg3Walk,
      totalTimeSeconds,
      totalDistanceMeters,
      estimatedFare,
      pickupStop,
      dropoffStop,
    };
  }

  // ============================================================================
  // Candidate Stop Selection
  // ============================================================================

  /**
   * Austin: Find candidate stops near a location
   */
  private async findCandidateStops(
    location: GeoCoordinate,
    count: number,
  ): Promise<H3IndexedStop[]> {
    const stops = await this.redisH3Spatial.findStopsNearCoordinate(
      location.latitude,
      location.longitude,
      2, // k=2 for ~260m radius
    );

    if (stops.length === 0) {
      // Expand search if no stops found
      const expandedStops = await this.redisH3Spatial.findStopsNearCoordinate(
        location.latitude,
        location.longitude,
        3, // k=3 for ~400m radius
      );
      return expandedStops.slice(0, count);
    }

    // Sort by walking distance and return top N
    const scored = stops.map((stop) => ({
      stop,
      distance: this.h3Service.calculateDistance(location, stop.location),
    }));
    scored.sort((a, b) => a.distance - b.distance);

    return scored.slice(0, count).map((s) => s.stop);
  }

  /**
   * Austin: Optimize stop selection using many-to-many matrix
   * Finds the pair (pickup, dropoff) that minimizes total trip time
   */
  private async optimizeStopSelection(
    userOrigin: GeoCoordinate,
    userDestination: GeoCoordinate,
    pickupCandidates: H3IndexedStop[],
    dropoffCandidates: H3IndexedStop[],
  ): Promise<{ pickupStop: H3IndexedStop; dropoffStop: H3IndexedStop; driveTimeSeconds: number }> {
    // Build driving time matrix between all pickup-dropoff pairs
    const driveMatrix = await this.getDrivingTimeMatrix(pickupCandidates, dropoffCandidates);

    let bestPickup = pickupCandidates[0];
    let bestDropoff = dropoffCandidates[0];
    let bestTotalTime = Infinity;
    let bestDriveTime = 0;

    for (let i = 0; i < pickupCandidates.length; i++) {
      const pickup = pickupCandidates[i];
      const walkToPickup = this.estimateWalkingTime(userOrigin, pickup.location);

      for (let j = 0; j < dropoffCandidates.length; j++) {
        const dropoff = dropoffCandidates[j];
        const driveTime = driveMatrix[i][j];
        const walkFromDropoff = this.estimateWalkingTime(dropoff.location, userDestination);

        const totalTime = walkToPickup + driveTime + walkFromDropoff;

        if (totalTime < bestTotalTime) {
          bestTotalTime = totalTime;
          bestPickup = pickup;
          bestDropoff = dropoff;
          bestDriveTime = driveTime;
        }
      }
    }

    this.logger.debug(
      `Optimized stops: pickup=${bestPickup.stopName}, dropoff=${bestDropoff.stopName}, time=${bestTotalTime}s`,
    );

    return {
      pickupStop: bestPickup,
      dropoffStop: bestDropoff,
      driveTimeSeconds: bestDriveTime,
    };
  }

  // ============================================================================
  // Route Leg Generation
  // ============================================================================

  /**
   * Austin: Generate walking route leg
   */
  private async generateWalkingLeg(from: GeoCoordinate, to: GeoCoordinate): Promise<RouteLeg> {
    if (this.mapboxToken) {
      return this.fetchMapboxRoute(from, to, 'walking');
    }

    // Fallback: estimate based on Haversine distance
    const distance = this.h3Service.calculateDistance(from, to);
    const duration = Math.ceil(distance / WALKING_ASSUMPTIONS.AVG_SPEED_MPS);

    return {
      origin: from,
      destination: to,
      durationSeconds: duration,
      distanceMeters: distance,
      mode: 'walking',
    };
  }

  /**
   * Austin: Generate driving route leg
   * Uses driving-traffic profile for real-time traffic consideration
   */
  private async generateDrivingLeg(from: GeoCoordinate, to: GeoCoordinate): Promise<RouteLeg> {
    if (this.mapboxToken) {
      return this.fetchMapboxRoute(from, to, 'driving-traffic');
    }

    // Fallback: estimate based on Haversine distance and average speed
    const distance = this.h3Service.calculateDistance(from, to);
    // Assume average urban speed of 25 km/h = 6.94 m/s
    const duration = Math.ceil(distance / 6.94);

    return {
      origin: from,
      destination: to,
      durationSeconds: duration,
      distanceMeters: distance,
      mode: 'driving',
    };
  }

  /**
   * Austin: Fetch route from Mapbox Directions API
   */
  private async fetchMapboxRoute(
    from: GeoCoordinate,
    to: GeoCoordinate,
    profile: 'walking' | 'driving' | 'driving-traffic',
  ): Promise<RouteLeg> {
    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `${this.mapboxBaseUrl}/directions/v5/mapbox/${profile}/${coordinates}`;

    const params = new URLSearchParams({
      access_token: this.mapboxToken,
      geometries: 'polyline6',
      overview: 'full',
      approaches: 'curb;curb', // Austin: Force curb-side arrival for safety
    });

    try {
      const response = await fetch(`${url}?${params}`);
      const data: MapboxDirectionsResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || 'No route found');
      }

      const route = data.routes[0];
      return {
        origin: from,
        destination: to,
        durationSeconds: Math.ceil(route.duration),
        distanceMeters: Math.ceil(route.distance),
        geometry: route.geometry,
        mode: profile === 'walking' ? 'walking' : 'driving',
      };
    } catch (error) {
      this.logger.warn(`Mapbox API error, using estimation: ${error}`);
      // Fallback to estimation
      const distance = this.h3Service.calculateDistance(from, to);
      const speed = profile === 'walking' ? WALKING_ASSUMPTIONS.AVG_SPEED_MPS : 6.94;
      return {
        origin: from,
        destination: to,
        durationSeconds: Math.ceil(distance / speed),
        distanceMeters: distance,
        mode: profile === 'walking' ? 'walking' : 'driving',
      };
    }
  }

  /**
   * Austin: Get driving time matrix between pickup and dropoff candidates
   */
  private async getDrivingTimeMatrix(
    pickups: H3IndexedStop[],
    dropoffs: H3IndexedStop[],
  ): Promise<number[][]> {
    if (!this.mapboxToken) {
      // Fallback: estimate using Haversine distance
      return pickups.map((pickup) =>
        dropoffs.map((dropoff) => {
          const distance = this.h3Service.calculateDistance(pickup.location, dropoff.location);
          return Math.ceil(distance / 6.94); // 25 km/h average
        }),
      );
    }

    // Build coordinate string for matrix API
    const pickupCoords = pickups.map((p) => `${p.location.longitude},${p.location.latitude}`);
    const dropoffCoords = dropoffs.map((d) => `${d.location.longitude},${d.location.latitude}`);
    const allCoords = [...pickupCoords, ...dropoffCoords].join(';');

    const sources = pickups.map((_, i) => i).join(';');
    const destinations = dropoffs.map((_, i) => i + pickups.length).join(';');

    const url = `${this.mapboxBaseUrl}/directions-matrix/v1/mapbox/driving-traffic/${allCoords}`;
    const params = new URLSearchParams({
      access_token: this.mapboxToken,
      sources,
      destinations,
      annotations: 'duration',
    });

    try {
      const response = await fetch(`${url}?${params}`);
      const data: MapboxMatrixResponse = await response.json();

      if (data.code !== 'Ok' || !data.durations) {
        throw new Error(data.message || 'Matrix API failed');
      }

      return data.durations;
    } catch (error) {
      this.logger.warn(`Matrix API error, using estimation: ${error}`);
      // Fallback
      return pickups.map((pickup) =>
        dropoffs.map((dropoff) => {
          const distance = this.h3Service.calculateDistance(pickup.location, dropoff.location);
          return Math.ceil(distance / 6.94);
        }),
      );
    }
  }

  /**
   * Austin: Estimate walking time between two coordinates
   */
  private estimateWalkingTime(from: GeoCoordinate, to: GeoCoordinate): number {
    const distance = this.h3Service.calculateDistance(from, to);
    return Math.ceil(distance / WALKING_ASSUMPTIONS.AVG_SPEED_MPS);
  }

  // ============================================================================
  // Smart Snap Integration
  // ============================================================================

  /**
   * Austin: Get smart snap result for a single location (pickup or dropoff)
   * Uses the H3Service's smart snap algorithm
   */
  async getSmartSnap(
    location: GeoCoordinate,
    destination?: GeoCoordinate,
  ): Promise<SmartSnapResult | null> {
    const candidates = await this.redisH3Spatial.findStopsNearCoordinate(
      location.latitude,
      location.longitude,
      2,
    );

    if (candidates.length === 0) {
      return null;
    }

    return this.h3Service.calculateSmartSnap(location, candidates, destination);
  }

  // ============================================================================
  // ETA Calculation
  // ============================================================================

  /**
   * Austin: Calculate complete ETA breakdown
   * ETA_total = T_walk1 + T_wait + T_load + T_drive + T_unload + T_walk2
   */
  calculateETABreakdown(
    route: StitchedRoute,
    driverETASeconds: number,
    dwellTimeSeconds: number = 30,
  ): {
    walkToPickup: number;
    waitForDriver: number;
    boarding: number;
    drive: number;
    alighting: number;
    walkToDestination: number;
    total: number;
  } {
    const breakdown = {
      walkToPickup: route.leg1Walk.durationSeconds,
      waitForDriver: driverETASeconds,
      boarding: dwellTimeSeconds,
      drive: route.leg2Drive.durationSeconds,
      alighting: dwellTimeSeconds,
      walkToDestination: route.leg3Walk.durationSeconds,
      total: 0,
    };

    breakdown.total =
      breakdown.walkToPickup +
      breakdown.waitForDriver +
      breakdown.boarding +
      breakdown.drive +
      breakdown.alighting +
      breakdown.walkToDestination;

    return breakdown;
  }

  // ============================================================================
  // Route Caching (for cost optimization)
  // ============================================================================

  /**
   * Austin: Cache key for route segment
   * Routes between the same stops are cached to reduce API calls
   */
  private getRouteCacheKey(from: H3IndexedStop, to: H3IndexedStop): string {
    return `route:${from.stopId}:${to.stopId}`;
  }
}
