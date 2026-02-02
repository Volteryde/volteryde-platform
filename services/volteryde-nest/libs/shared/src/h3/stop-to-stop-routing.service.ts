// ============================================================================
// Stop-to-Stop Routing Service
// ============================================================================
// Austin: Simple stop-to-stop routing for VolteRyde bus service
// Users select pickup and dropoff stops - we calculate route and fare
// NO walking legs - that's the user's responsibility

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GeoCoordinate, H3IndexedStop } from './h3.types';
import { DistancePricingService, FareBreakdown } from './distance-pricing.service';
import { RedisH3SpatialService } from './redis-h3-spatial.service';

/**
 * Austin: Stop-to-stop route result
 */
export interface StopToStopRoute {
  /** Pickup stop details */
  pickupStop: H3IndexedStop;
  /** Dropoff stop details */
  dropoffStop: H3IndexedStop;
  /** Driving distance in meters */
  distanceMeters: number;
  /** Estimated drive time in seconds */
  durationSeconds: number;
  /** Route geometry (encoded polyline) for map display */
  geometry?: string;
  /** Fare breakdown */
  fare: FareBreakdown;
}

/**
 * Austin: Nearby stops result
 */
export interface NearbyStopsResult {
  /** List of stops near the location */
  stops: H3IndexedStop[];
  /** User's location used for search */
  searchLocation: GeoCoordinate;
  /** Search radius in meters */
  radiusMeters: number;
}

/**
 * Austin: Fare estimate request
 */
export interface FareEstimateRequest {
  pickupStopId: string;
  dropoffStopId: string;
}

/**
 * Austin: Fare estimate result
 */
export interface FareEstimateResult {
  pickupStop: {
    stopId: string;
    stopName: string;
    location: GeoCoordinate;
  };
  dropoffStop: {
    stopId: string;
    stopName: string;
    location: GeoCoordinate;
  };
  distanceKm: number;
  fare: FareBreakdown;
}

@Injectable()
export class StopToStopRoutingService {
  private readonly logger = new Logger(StopToStopRoutingService.name);
  private readonly mapboxToken: string;
  private readonly mapboxBaseUrl = 'https://api.mapbox.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisH3Spatial: RedisH3SpatialService,
    private readonly pricingService: DistancePricingService,
  ) {
    this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN', '');
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN not configured - distance will be estimated');
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Austin: Find stops near a user's location
   * Uses H3 k-ring search for O(1) lookup
   */
  async findNearbyStops(
    location: GeoCoordinate,
    radiusK: number = 2, // k=2 gives ~260m radius at Res 10
  ): Promise<NearbyStopsResult> {
    const stops = await this.redisH3Spatial.findStopsNearCoordinate(
      location.latitude,
      location.longitude,
      radiusK,
    );

    // Austin: Filter only active stops and sort by distance
    const activeStops = stops
      .filter(stop => stop.isActiveForPickup)
      .map(stop => ({
        stop,
        distance: this.calculateDistance(location, stop.location),
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.stop);

    // Austin: Approximate radius based on k value at Res 10
    const radiusMeters = radiusK * 130; // ~130m per k at Res 10

    return {
      stops: activeStops,
      searchLocation: location,
      radiusMeters,
    };
  }

  /**
   * Austin: Get fare estimate between two stops
   * This is called before booking to show the user the price
   */
  async getFareEstimate(request: FareEstimateRequest): Promise<FareEstimateResult> {
    const { pickupStopId, dropoffStopId } = request;

    // Get stop details from Redis
    const pickupStop = await this.redisH3Spatial.getStopMetadata(pickupStopId);
    const dropoffStop = await this.redisH3Spatial.getStopMetadata(dropoffStopId);

    if (!pickupStop) {
      throw new Error(`Pickup stop not found: ${pickupStopId}`);
    }
    if (!dropoffStop) {
      throw new Error(`Dropoff stop not found: ${dropoffStopId}`);
    }

    // Calculate route distance
    const routeDistance = await this.getRouteDistance(
      pickupStop.location,
      dropoffStop.location,
    );

    // Calculate fare based on distance
    const fare = this.pricingService.calculateFareWithRouteDistance(
      pickupStop.location,
      dropoffStop.location,
      routeDistance.distanceMeters,
    );

    return {
      pickupStop: {
        stopId: pickupStop.stopId,
        stopName: pickupStop.stopName,
        location: pickupStop.location,
      },
      dropoffStop: {
        stopId: dropoffStop.stopId,
        stopName: dropoffStop.stopName,
        location: dropoffStop.location,
      },
      distanceKm: routeDistance.distanceMeters / 1000,
      fare,
    };
  }

  /**
   * Austin: Calculate complete route between two stops
   * Returns full route details for booking confirmation
   */
  async calculateRoute(
    pickupStopId: string,
    dropoffStopId: string,
  ): Promise<StopToStopRoute> {
    // Get stop details
    const pickupStop = await this.redisH3Spatial.getStopMetadata(pickupStopId);
    const dropoffStop = await this.redisH3Spatial.getStopMetadata(dropoffStopId);

    if (!pickupStop) {
      throw new Error(`Pickup stop not found: ${pickupStopId}`);
    }
    if (!dropoffStop) {
      throw new Error(`Dropoff stop not found: ${dropoffStopId}`);
    }

    // Get route from Mapbox (or estimate)
    const routeDetails = await this.getRouteDetails(
      pickupStop.location,
      dropoffStop.location,
    );

    // Calculate fare
    const fare = this.pricingService.calculateFareWithRouteDistance(
      pickupStop.location,
      dropoffStop.location,
      routeDetails.distanceMeters,
    );

    return {
      pickupStop,
      dropoffStop,
      distanceMeters: routeDetails.distanceMeters,
      durationSeconds: routeDetails.durationSeconds,
      geometry: routeDetails.geometry,
      fare,
    };
  }

  /**
   * Austin: Get all stops in a zone (for map display)
   */
  async getStopsInZone(
    centerLocation: GeoCoordinate,
    radiusK: number = 5,
  ): Promise<H3IndexedStop[]> {
    return this.redisH3Spatial.findStopsNearCoordinate(
      centerLocation.latitude,
      centerLocation.longitude,
      radiusK,
    );
  }

  // ============================================================================
  // Route Calculation Helpers
  // ============================================================================

  /**
   * Austin: Get route distance between two points
   * Uses Mapbox if available, otherwise estimates
   */
  private async getRouteDistance(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
  ): Promise<{ distanceMeters: number; durationSeconds: number }> {
    if (this.mapboxToken) {
      try {
        return await this.fetchMapboxRoute(origin, destination);
      } catch (error) {
        this.logger.warn(`Mapbox routing failed, using estimate: ${error.message}`);
      }
    }

    // Austin: Fallback to estimated distance (1.3x straight line)
    const straightLine = this.calculateDistance(origin, destination);
    const estimatedRoadDistance = straightLine * 1.3;
    const estimatedDuration = estimatedRoadDistance / 8.33; // ~30 km/h average

    return {
      distanceMeters: estimatedRoadDistance,
      durationSeconds: estimatedDuration,
    };
  }

  /**
   * Austin: Get full route details including geometry
   */
  private async getRouteDetails(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
  ): Promise<{ distanceMeters: number; durationSeconds: number; geometry?: string }> {
    if (this.mapboxToken) {
      try {
        return await this.fetchMapboxRouteWithGeometry(origin, destination);
      } catch (error) {
        this.logger.warn(`Mapbox routing failed, using estimate: ${error.message}`);
      }
    }

    // Fallback
    const straightLine = this.calculateDistance(origin, destination);
    return {
      distanceMeters: straightLine * 1.3,
      durationSeconds: (straightLine * 1.3) / 8.33,
      geometry: undefined,
    };
  }

  /**
   * Austin: Fetch route from Mapbox Directions API
   */
  private async fetchMapboxRoute(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
  ): Promise<{ distanceMeters: number; durationSeconds: number }> {
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `${this.mapboxBaseUrl}/directions/v5/mapbox/driving/${coordinates}?access_token=${this.mapboxToken}&overview=false`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      throw new Error(`Mapbox routing failed: ${data.message || 'No route found'}`);
    }

    return {
      distanceMeters: data.routes[0].distance,
      durationSeconds: data.routes[0].duration,
    };
  }

  /**
   * Austin: Fetch route with geometry from Mapbox
   */
  private async fetchMapboxRouteWithGeometry(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
  ): Promise<{ distanceMeters: number; durationSeconds: number; geometry: string }> {
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `${this.mapboxBaseUrl}/directions/v5/mapbox/driving/${coordinates}?access_token=${this.mapboxToken}&overview=full&geometries=polyline`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      throw new Error(`Mapbox routing failed: ${data.message || 'No route found'}`);
    }

    return {
      distanceMeters: data.routes[0].distance,
      durationSeconds: data.routes[0].duration,
      geometry: data.routes[0].geometry,
    };
  }

  // ============================================================================
  // Distance Calculation
  // ============================================================================

  /**
   * Austin: Haversine distance between two coordinates
   */
  private calculateDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (coord1.latitude * Math.PI) / 180;
    const lat2Rad = (coord2.latitude * Math.PI) / 180;
    const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
