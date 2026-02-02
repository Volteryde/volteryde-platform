// ============================================================================
// Mapbox Navigator Service
// ============================================================================
// Generates turn-by-turn routes for drivers between bus stops
// Uses Mapbox Directions API with driving-traffic profile

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	GeoCoordinate,
	RouteLeg,
	RouteStep,
	NavigationRoute,
} from './mapbox.types';

/**
 * Mapbox Directions API response type
 */
interface DirectionsResponse {
	code: string;
	routes: Array<{
		distance: number;
		duration: number;
		geometry: string;
		legs: Array<{
			distance: number;
			duration: number;
			steps: Array<{
				distance: number;
				duration: number;
				name: string;
				maneuver: {
					type: string;
					modifier?: string;
					instruction: string;
					location: [number, number];
				};
			}>;
		}>;
	}>;
	waypoints: Array<{
		name: string;
		location: [number, number];
	}>;
	message?: string;
}

/**
 * Mapbox Navigator Service
 * 
 * Responsibilities:
 * 1. Generate turn-by-turn routes between bus stops
 * 2. Calculate accurate ETAs with traffic consideration
 * 3. Provide route geometry for map display
 * 4. Cache frequently traveled routes
 */
@Injectable()
export class MapboxNavigatorService {
	private readonly logger = new Logger(MapboxNavigatorService.name);
	private readonly mapboxToken: string;
	private readonly baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';

	// Route cache (should be Redis in production)
	private readonly cache = new Map<string, { data: RouteLeg; expiresAt: number }>();
	private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes for routes (traffic changes)

	constructor(private readonly configService: ConfigService) {
		this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN', '');

		if (!this.mapboxToken) {
			this.logger.warn('MAPBOX_ACCESS_TOKEN not configured - navigator service will fail');
		}
	}

	// ============================================================================
	// Public API
	// ============================================================================

	/**
	 * Get complete navigation route for a driver
	 * 
	 * @param driverLocation - Driver's current GPS location
	 * @param pickupStop - Pickup stop details
	 * @param dropoffStop - Dropoff stop details
	 * @returns Complete navigation route with legs and ETAs
	 */
	async getNavigationRoute(
		driverLocation: GeoCoordinate,
		pickupStop: { stopId: string; stopName: string; location: GeoCoordinate },
		dropoffStop: { stopId: string; stopName: string; location: GeoCoordinate },
	): Promise<NavigationRoute> {
		this.logger.debug(
			`Generating route: Driver -> ${pickupStop.stopName} -> ${dropoffStop.stopName}`,
		);

		// Get both route legs in parallel
		const [toPickupLeg, tripLeg] = await Promise.all([
			this.getRouteLeg(driverLocation, pickupStop.location, 'driving-traffic'),
			this.getRouteLeg(pickupStop.location, dropoffStop.location, 'driving-traffic'),
		]);

		const now = new Date();
		const etaPickup = new Date(now.getTime() + toPickupLeg.duration * 1000);
		const etaDropoff = new Date(etaPickup.getTime() + tripLeg.duration * 1000);

		return {
			pickupStop,
			dropoffStop,
			toPickupLeg,
			tripLeg,
			totalDistanceMeters: toPickupLeg.distance + tripLeg.distance,
			totalDurationSeconds: toPickupLeg.duration + tripLeg.duration,
			etaPickup,
			etaDropoff,
		};
	}

	/**
	 * Get route leg between two points
	 * 
	 * @param origin - Starting point
	 * @param destination - Ending point
	 * @param profile - Routing profile (driving, driving-traffic, walking)
	 * @returns Route leg with geometry and steps
	 */
	async getRouteLeg(
		origin: GeoCoordinate,
		destination: GeoCoordinate,
		profile: 'driving' | 'driving-traffic' | 'walking' = 'driving-traffic',
	): Promise<RouteLeg> {
		// Check cache for non-traffic routes (they're more stable)
		if (profile !== 'driving-traffic') {
			const cacheKey = this.getRouteCacheKey(origin, destination, profile);
			const cached = this.cache.get(cacheKey);
			if (cached && cached.expiresAt > Date.now()) {
				this.logger.debug('Returning cached route leg');
				return cached.data;
			}
		}

		// Build Directions API URL
		const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
		const url = new URL(`${this.baseUrl}/${profile}/${coords}`);
		url.searchParams.set('access_token', this.mapboxToken);
		url.searchParams.set('geometries', 'polyline');
		url.searchParams.set('overview', 'full');
		url.searchParams.set('steps', 'true');
		url.searchParams.set('banner_instructions', 'true');
		url.searchParams.set('voice_instructions', 'true');

		this.logger.debug(`Directions API: ${profile} route`);

		try {
			const response = await fetch(url.toString());

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Directions API error (${response.status}): ${errorText}`);
			}

			const data: DirectionsResponse = await response.json();

			if (data.code !== 'Ok' || !data.routes?.[0]) {
				throw new Error(`Directions API failed: ${data.message || 'No route found'}`);
			}

			const route = data.routes[0];
			const leg = route.legs[0];

			const routeLeg: RouteLeg = {
				distance: route.distance,
				duration: route.duration,
				geometry: route.geometry,
				steps: leg.steps.map((step) => this.parseStep(step)),
			};

			// Cache non-traffic routes
			if (profile !== 'driving-traffic') {
				const cacheKey = this.getRouteCacheKey(origin, destination, profile);
				this.cache.set(cacheKey, {
					data: routeLeg,
					expiresAt: Date.now() + this.cacheTtl,
				});
			}

			return routeLeg;
		} catch (error) {
			this.logger.error(`Directions API failed: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Get just the route geometry (for map display without full navigation)
	 * 
	 * @param origin - Starting point
	 * @param destination - Ending point
	 * @returns Encoded polyline geometry string
	 */
	async getRouteGeometry(
		origin: GeoCoordinate,
		destination: GeoCoordinate,
	): Promise<string> {
		const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
		const url = new URL(`${this.baseUrl}/driving/${coords}`);
		url.searchParams.set('access_token', this.mapboxToken);
		url.searchParams.set('geometries', 'polyline');
		url.searchParams.set('overview', 'full');
		url.searchParams.set('steps', 'false');

		try {
			const response = await fetch(url.toString());

			if (!response.ok) {
				throw new Error(`Directions API error: ${response.status}`);
			}

			const data: DirectionsResponse = await response.json();

			if (data.code !== 'Ok' || !data.routes?.[0]) {
				throw new Error('No route found');
			}

			return data.routes[0].geometry;
		} catch (error) {
			this.logger.error(`Failed to get route geometry: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Get ETA from current location to a stop
	 * 
	 * @param currentLocation - Current GPS location
	 * @param stopLocation - Target stop location
	 * @returns ETA as Date object
	 */
	async getETAToStop(
		currentLocation: GeoCoordinate,
		stopLocation: GeoCoordinate,
	): Promise<{ etaDate: Date; durationSeconds: number; distanceMeters: number }> {
		const leg = await this.getRouteLeg(currentLocation, stopLocation, 'driving-traffic');

		return {
			etaDate: new Date(Date.now() + leg.duration * 1000),
			durationSeconds: leg.duration,
			distanceMeters: leg.distance,
		};
	}

	/**
	 * Update navigation with new driver location
	 * Recalculates route from current position
	 * 
	 * @param currentLocation - Driver's updated GPS location
	 * @param currentRoute - Existing navigation route
	 * @returns Updated navigation route
	 */
	async updateNavigation(
		currentLocation: GeoCoordinate,
		currentRoute: NavigationRoute,
	): Promise<NavigationRoute> {
		// Recalculate only the leg the driver is currently on
		const distanceToPickup = this.haversineDistance(
			currentLocation,
			currentRoute.pickupStop.location,
		);

		// If driver is within 50m of pickup, consider them arrived
		if (distanceToPickup < 50) {
			// Driver is at pickup, only need trip leg
			const tripLeg = await this.getRouteLeg(
				currentRoute.pickupStop.location,
				currentRoute.dropoffStop.location,
				'driving-traffic',
			);

			return {
				...currentRoute,
				toPickupLeg: undefined,
				tripLeg,
				totalDistanceMeters: tripLeg.distance,
				totalDurationSeconds: tripLeg.duration,
				etaPickup: new Date(),
				etaDropoff: new Date(Date.now() + tripLeg.duration * 1000),
			};
		}

		// Driver is still en route to pickup
		const [toPickupLeg, tripLeg] = await Promise.all([
			this.getRouteLeg(currentLocation, currentRoute.pickupStop.location, 'driving-traffic'),
			// Cache this as it won't change
			this.getRouteLeg(
				currentRoute.pickupStop.location,
				currentRoute.dropoffStop.location,
				'driving', // Use non-traffic for caching
			),
		]);

		const now = new Date();
		const etaPickup = new Date(now.getTime() + toPickupLeg.duration * 1000);
		const etaDropoff = new Date(etaPickup.getTime() + tripLeg.duration * 1000);

		return {
			...currentRoute,
			toPickupLeg,
			tripLeg,
			totalDistanceMeters: toPickupLeg.distance + tripLeg.distance,
			totalDurationSeconds: toPickupLeg.duration + tripLeg.duration,
			etaPickup,
			etaDropoff,
		};
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	/**
	 * Parse a Mapbox step into our RouteStep format
	 */
	private parseStep(step: DirectionsResponse['routes'][0]['legs'][0]['steps'][0]): RouteStep {
		return {
			distance: step.distance,
			duration: step.duration,
			instruction: step.maneuver.instruction,
			maneuverType: step.maneuver.type,
			maneuverModifier: step.maneuver.modifier,
			maneuverLocation: step.maneuver.location,
			name: step.name,
		};
	}

	/**
	 * Generate cache key for route
	 */
	private getRouteCacheKey(
		origin: GeoCoordinate,
		destination: GeoCoordinate,
		profile: string,
	): string {
		const originKey = `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}`;
		const destKey = `${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}`;
		return `route:${profile}:${originKey}:${destKey}`;
	}

	/**
	 * Calculate Haversine distance between two coordinates
	 */
	private haversineDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
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
