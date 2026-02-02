// ============================================================================
// Mapbox Locator Service
// ============================================================================
// Snaps user GPS coordinates to the nearest valid bus stop using Mapbox Tilequery API
// This is the core service for enforcing bus-stop-to-bus-stop routing

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	GeoCoordinate,
	SnapResult,
	ServiceVoidError,
	TilequeryResponse,
	TilequeryFeature,
	StopMetadata,
	WALKING_ASSUMPTIONS,
	DEFAULT_MAPBOX_CONFIG,
} from './mapbox.types';

/**
 * Mapbox Locator Service
 * 
 * Responsibilities:
 * 1. Snap user GPS to nearest bus stop via Tilequery API
 * 2. Return SERVICE_VOID error when no stops are nearby
 * 3. Cache tilequery results to reduce API calls
 * 4. Provide candidate stops for matchmaker service
 */
@Injectable()
export class MapboxLocatorService {
	private readonly logger = new Logger(MapboxLocatorService.name);
	private readonly mapboxToken: string;
	private readonly tilesetId: string;
	private readonly baseUrl = 'https://api.mapbox.com/v4';
	private readonly defaultRadius: number;
	private readonly maxRadius: number;

	// Simple in-memory cache (should be replaced with Redis in production)
	private readonly cache = new Map<string, { data: TilequeryResponse; expiresAt: number }>();
	private readonly cacheTtl: number;

	constructor(private readonly configService: ConfigService) {
		this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN', '');
		this.tilesetId = this.configService.get<string>(
			'MAPBOX_STOPS_TILESET_ID',
			DEFAULT_MAPBOX_CONFIG.stopsTilesetId!,
		);
		this.defaultRadius = this.configService.get<number>(
			'MAPBOX_DEFAULT_SNAP_RADIUS',
			DEFAULT_MAPBOX_CONFIG.defaultSnapRadiusMeters!,
		);
		this.maxRadius = this.configService.get<number>(
			'MAPBOX_MAX_SNAP_RADIUS',
			DEFAULT_MAPBOX_CONFIG.maxSnapRadiusMeters!,
		);
		this.cacheTtl = this.configService.get<number>(
			'MAPBOX_TILEQUERY_CACHE_TTL',
			DEFAULT_MAPBOX_CONFIG.tilequeryCacheTtlSeconds!,
		) * 1000; // Convert to milliseconds

		if (!this.mapboxToken) {
			this.logger.warn('MAPBOX_ACCESS_TOKEN not configured - locator service will fail');
		}
	}

	// ============================================================================
	// Public API
	// ============================================================================

	/**
	 * Snap user GPS to the nearest valid bus stop
	 * 
	 * @param userLocation - User's GPS coordinates
	 * @param radiusMeters - Search radius (default: 500m, max: 1500m)
	 * @returns SnapResult with stop details and walking distance
	 * @throws ServiceVoidError if no stops found within radius
	 */
	async snapToNearestStop(
		userLocation: GeoCoordinate,
		radiusMeters?: number,
	): Promise<SnapResult> {
		const radius = Math.min(radiusMeters ?? this.defaultRadius, this.maxRadius);

		this.logger.debug(
			`Snapping location (${userLocation.latitude}, ${userLocation.longitude}) with radius ${radius}m`,
		);

		// Query tileset for nearby stops
		const response = await this.queryTileset(userLocation, radius);

		// Filter for active stops only
		const activeStops = response.features.filter(
			(f) => f.properties.is_active !== false,
		);

		if (activeStops.length === 0) {
			this.logger.warn(
				`No active stops found near (${userLocation.latitude}, ${userLocation.longitude}) within ${radius}m`,
			);
			throw new ServiceVoidError(userLocation, radius);
		}

		// Return the nearest stop (Tilequery returns sorted by distance)
		const nearestFeature = activeStops[0];
		return this.featureToSnapResult(nearestFeature);
	}

	/**
	 * Get multiple candidate stops near a location
	 * Used by Matchmaker service for optimal stop selection
	 * 
	 * @param userLocation - User's GPS coordinates
	 * @param radiusMeters - Search radius
	 * @param limit - Maximum number of candidates to return
	 * @returns Array of SnapResults sorted by walking distance
	 */
	async getCandidateStops(
		userLocation: GeoCoordinate,
		radiusMeters?: number,
		limit: number = 5,
	): Promise<SnapResult[]> {
		const radius = Math.min(radiusMeters ?? this.defaultRadius, this.maxRadius);

		const response = await this.queryTileset(userLocation, radius, limit);

		// Filter for active stops and convert to SnapResults
		const candidates = response.features
			.filter((f) => f.properties.is_active !== false)
			.map((f) => this.featureToSnapResult(f));

		this.logger.debug(
			`Found ${candidates.length} candidate stops near (${userLocation.latitude}, ${userLocation.longitude})`,
		);

		return candidates;
	}

	/**
	 * Check if a location is within service area (has nearby stops)
	 * Useful for quick validation before starting booking flow
	 * 
	 * @param location - Location to check
	 * @param radiusMeters - Search radius
	 * @returns true if at least one stop is nearby
	 */
	async isInServiceArea(
		location: GeoCoordinate,
		radiusMeters?: number,
	): Promise<boolean> {
		const radius = Math.min(radiusMeters ?? this.defaultRadius, this.maxRadius);

		try {
			const response = await this.queryTileset(location, radius, 1);
			return response.features.some((f) => f.properties.is_active !== false);
		} catch (error) {
			this.logger.error(`Service area check failed: ${error.message}`);
			return false;
		}
	}

	/**
	 * Get stop details by ID
	 * Queries the tileset for a specific stop
	 * 
	 * @param stopId - The stop ID to look up
	 * @returns SnapResult if found, null otherwise
	 */
	async getStopById(stopId: string): Promise<SnapResult | null> {
		// For now, this would need to be implemented via a separate lookup
		// In production, this should query the database directly
		// The Tilequery API doesn't support filtering by property efficiently
		this.logger.warn(
			`getStopById(${stopId}) called - consider using database lookup for efficiency`,
		);
		return null;
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	/**
	 * Query the Mapbox Tilequery API for stops near a location
	 */
	private async queryTileset(
		location: GeoCoordinate,
		radiusMeters: number,
		limit: number = 10,
	): Promise<TilequeryResponse> {
		// Check cache first
		const cacheKey = this.getCacheKey(location, radiusMeters, limit);
		const cached = this.cache.get(cacheKey);
		if (cached && cached.expiresAt > Date.now()) {
			this.logger.debug('Returning cached tilequery result');
			return cached.data;
		}

		// Build Tilequery URL
		// Format: /v4/{tileset_id}/tilequery/{lng},{lat}.json
		const url = new URL(
			`${this.baseUrl}/${this.tilesetId}/tilequery/${location.longitude},${location.latitude}.json`,
		);
		url.searchParams.set('access_token', this.mapboxToken);
		url.searchParams.set('radius', radiusMeters.toString());
		url.searchParams.set('limit', limit.toString());
		url.searchParams.set('layers', 'stops'); // Layer name in the tileset

		this.logger.debug(`Tilequery URL: ${url.toString().replace(this.mapboxToken, '[REDACTED]')}`);

		try {
			const response = await fetch(url.toString());

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Tilequery API error (${response.status}): ${errorText}`);
			}

			const data: TilequeryResponse = await response.json();

			// Cache the result
			this.cache.set(cacheKey, {
				data,
				expiresAt: Date.now() + this.cacheTtl,
			});

			// Cleanup old cache entries periodically
			this.pruneCache();

			return data;
		} catch (error) {
			this.logger.error(`Tilequery failed: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Convert a Tilequery feature to a SnapResult
	 */
	private featureToSnapResult(feature: TilequeryFeature): SnapResult {
		const { properties, geometry } = feature;
		const walkingDistance = properties.tilequery.distance;

		return {
			stopId: properties.stop_id,
			stopName: properties.stop_name,
			stopCode: properties.stop_code,
			location: {
				latitude: geometry.coordinates[1],
				longitude: geometry.coordinates[0],
			},
			walkingDistanceMeters: walkingDistance,
			walkingTimeSeconds: this.estimateWalkingTime(walkingDistance),
			isActive: properties.is_active ?? true,
			metadata: this.extractMetadata(properties),
		};
	}

	/**
	 * Extract optional metadata from feature properties
	 */
	private extractMetadata(properties: TilequeryFeature['properties']): StopMetadata {
		return {
			zoneId: properties.zone_id,
			isChargingStation: properties.is_charging_station,
			wheelchairAccessible: properties.wheelchair_accessible,
			routesServed: properties.routes_served,
			amenities: properties.amenities,
		};
	}

	/**
	 * Estimate walking time based on distance
	 */
	private estimateWalkingTime(distanceMeters: number): number {
		return Math.round(distanceMeters / WALKING_ASSUMPTIONS.SPEED_MPS);
	}

	/**
	 * Generate cache key for a location query
	 * Uses geohash-like precision to bucket nearby queries
	 */
	private getCacheKey(location: GeoCoordinate, radius: number, limit: number): string {
		// Round coordinates to ~10m precision for cache grouping
		const latBucket = Math.round(location.latitude * 10000) / 10000;
		const lngBucket = Math.round(location.longitude * 10000) / 10000;
		return `tilequery:${latBucket}:${lngBucket}:${radius}:${limit}`;
	}

	/**
	 * Remove expired cache entries
	 */
	private pruneCache(): void {
		const now = Date.now();
		let pruned = 0;

		for (const [key, value] of this.cache.entries()) {
			if (value.expiresAt <= now) {
				this.cache.delete(key);
				pruned++;
			}
		}

		if (pruned > 0) {
			this.logger.debug(`Pruned ${pruned} expired cache entries`);
		}
	}
}
