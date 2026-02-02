// ============================================================================
// Mapbox Matchmaker Service
// ============================================================================
// Calculates optimal pickup/dropoff stop pairs using Mapbox Matrix API
// Minimizes total trip time: walking to pickup + driving + walking from dropoff

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	GeoCoordinate,

	StopPairResult,
	MatrixRequest,
	MatrixResponse,
	FareEstimateRequest,
	FareEstimateResult,
	FareBreakdown,

	DEFAULT_MAPBOX_CONFIG,
} from './mapbox.types';
import { MapboxLocatorService } from './mapbox-locator.service';

/**
 * Mapbox Matchmaker Service
 * 
 * Responsibilities:
 * 1. Find optimal pickup/dropoff stop pair from candidates
 * 2. Calculate many-to-many driving times via Matrix API
 * 3. Compute fare estimates based on distance
 * 4. Cache matrix results to reduce API calls
 */
@Injectable()
export class MapboxMatchmakerService {
	private readonly logger = new Logger(MapboxMatchmakerService.name);
	private readonly mapboxToken: string;
	private readonly baseUrl = 'https://api.mapbox.com/directions-matrix/v1/mapbox';
	private readonly cacheTtl: number;

	// Simple in-memory cache (should be replaced with Redis in production)
	private readonly cache = new Map<string, { data: MatrixResponse; expiresAt: number }>();

	// Fare calculation constants (should be in config)
	private readonly FARE_BASE_GHS = 3.0; // Base fare in Ghana Cedis
	private readonly FARE_PER_KM_GHS = 2.0; // Per kilometer rate
	private readonly FARE_PER_MIN_GHS = 0.5; // Per minute rate

	constructor(
		private readonly configService: ConfigService,
		private readonly locatorService: MapboxLocatorService,
	) {
		this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN', '');
		this.cacheTtl = this.configService.get<number>(
			'MAPBOX_MATRIX_CACHE_TTL',
			DEFAULT_MAPBOX_CONFIG.matrixCacheTtlSeconds!,
		) * 1000; // Convert to milliseconds

		if (!this.mapboxToken) {
			this.logger.warn('MAPBOX_ACCESS_TOKEN not configured - matchmaker service will fail');
		}
	}

	// ============================================================================
	// Public API
	// ============================================================================

	/**
	 * Find the optimal pickup and dropoff stop pair
	 * 
	 * Algorithm:
	 * 1. Get candidate stops near user's origin and destination
	 * 2. Use Matrix API to get all pairwise driving times
	 * 3. Calculate total trip time for each combination
	 * 4. Return the pair with minimum total time
	 * 
	 * @param userOrigin - User's starting location
	 * @param userDestination - User's desired destination
	 * @param pickupCandidateCount - Number of pickup candidates to consider
	 * @param dropoffCandidateCount - Number of dropoff candidates to consider
	 * @returns Optimal stop pair with driving/walking estimates
	 */
	async findOptimalStopPair(
		userOrigin: GeoCoordinate,
		userDestination: GeoCoordinate,
		pickupCandidateCount: number = 3,
		dropoffCandidateCount: number = 3,
	): Promise<StopPairResult> {
		this.logger.debug('Finding optimal stop pair...');

		// Step 1: Get candidate stops near origin and destination
		const [pickupCandidates, dropoffCandidates] = await Promise.all([
			this.locatorService.getCandidateStops(userOrigin, undefined, pickupCandidateCount),
			this.locatorService.getCandidateStops(userDestination, undefined, dropoffCandidateCount),
		]);

		if (pickupCandidates.length === 0) {
			throw new Error('No pickup stops found near origin');
		}
		if (dropoffCandidates.length === 0) {
			throw new Error('No dropoff stops found near destination');
		}

		// Step 2: Get driving time matrix between all pickup and dropoff candidates
		const matrixResult = await this.getMatrix({
			origins: pickupCandidates.map((c) => c.location),
			destinations: dropoffCandidates.map((c) => c.location),
			profile: 'driving-traffic',
			includeDistance: true,
		});

		// Step 3: Find the combination with minimum total time
		let bestPair: {
			pickupIdx: number;
			dropoffIdx: number;
			totalTime: number;
			driveTime: number;
			driveDistance: number;
		} | null = null;

		for (let p = 0; p < pickupCandidates.length; p++) {
			for (let d = 0; d < dropoffCandidates.length; d++) {
				const driveTime = matrixResult.durations[p][d];
				const driveDistance = matrixResult.distances?.[p][d] ?? 0;

				// Skip invalid durations (Mapbox returns null for unreachable pairs)
				if (driveTime === null || driveTime === undefined) continue;

				const walkToPickup = pickupCandidates[p].walkingTimeSeconds;
				const walkFromDropoff = dropoffCandidates[d].walkingTimeSeconds;
				const totalTime = walkToPickup + driveTime + walkFromDropoff;

				if (!bestPair || totalTime < bestPair.totalTime) {
					bestPair = {
						pickupIdx: p,
						dropoffIdx: d,
						totalTime,
						driveTime,
						driveDistance,
					};
				}
			}
		}

		if (!bestPair) {
			throw new Error('No valid routes found between candidate stops');
		}

		const pickupStop = pickupCandidates[bestPair.pickupIdx];
		const dropoffStop = dropoffCandidates[bestPair.dropoffIdx];

		this.logger.debug(
			`Optimal pair: ${pickupStop.stopName} -> ${dropoffStop.stopName} ` +
			`(${Math.round(bestPair.driveDistance / 1000)}km, ${Math.round(bestPair.driveTime / 60)}min)`,
		);

		return {
			pickupStop,
			dropoffStop,
			drivingDistanceMeters: bestPair.driveDistance,
			drivingDurationSeconds: bestPair.driveTime,
			totalWalkingTimeSeconds: pickupStop.walkingTimeSeconds + dropoffStop.walkingTimeSeconds,
			selectionReason: pickupCandidates.length === 1 && dropoffCandidates.length === 1
				? 'only_option'
				: 'shortest_total_time',
		};
	}

	/**
	 * Get fare estimate for a trip between two stops
	 * 
	 * @param request - Fare estimate request with stop IDs
	 * @returns Fare estimate with breakdown
	 */
	async getFareEstimate(request: FareEstimateRequest): Promise<FareEstimateResult> {


		// For now, we need to get stop locations from somewhere
		// In production, this would query the database
		// Using locator service as a temporary solution
		this.logger.warn(
			'getFareEstimate using locator service - should use database for stop lookup',
		);

		// This is a placeholder - in reality we'd look up stops by ID
		throw new Error(
			'getFareEstimate requires database integration for stop lookup by ID. ' +
			'Use getFareEstimateForStopPair with full stop details instead.',
		);
	}

	/**
	 * Get fare estimate for a known stop pair
	 * Use this when you already have the stop details from findOptimalStopPair
	 * 
	 * @param stopPair - Stop pair result from findOptimalStopPair
	 * @returns Fare estimate with breakdown
	 */
	getFareEstimateForStopPair(stopPair: StopPairResult): FareEstimateResult {
		const distanceKm = stopPair.drivingDistanceMeters / 1000;
		const durationMinutes = stopPair.drivingDurationSeconds / 60;

		const fare = this.calculateFare(distanceKm, durationMinutes);

		return {
			pickupStop: {
				stopId: stopPair.pickupStop.stopId,
				stopName: stopPair.pickupStop.stopName,
				location: stopPair.pickupStop.location,
			},
			dropoffStop: {
				stopId: stopPair.dropoffStop.stopId,
				stopName: stopPair.dropoffStop.stopName,
				location: stopPair.dropoffStop.location,
			},
			distanceKm,
			durationMinutes,
			fare,
			validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
		};
	}

	/**
	 * Get driving time and distance between two stops
	 * Wrapper around Matrix API for single origin/destination
	 * 
	 * @param origin - Origin stop location
	 * @param destination - Destination stop location
	 * @returns Driving duration (seconds) and distance (meters)
	 */
	async getDrivingTimeAndDistance(
		origin: GeoCoordinate,
		destination: GeoCoordinate,
	): Promise<{ durationSeconds: number; distanceMeters: number }> {
		const matrixResult = await this.getMatrix({
			origins: [origin],
			destinations: [destination],
			profile: 'driving-traffic',
			includeDistance: true,
		});

		return {
			durationSeconds: matrixResult.durations[0][0],
			distanceMeters: matrixResult.distances?.[0][0] ?? 0,
		};
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	/**
	 * Call Mapbox Matrix API
	 */
	private async getMatrix(request: MatrixRequest): Promise<MatrixResponse> {
		const { origins, destinations, profile = 'driving', includeDistance = true } = request;

		// Check cache first
		const cacheKey = this.getMatrixCacheKey(origins, destinations, profile);
		const cached = this.cache.get(cacheKey);
		if (cached && cached.expiresAt > Date.now()) {
			this.logger.debug('Returning cached matrix result');
			return cached.data;
		}

		// Build coordinates string
		// Format: origin1;origin2;...;destination1;destination2
		const allCoords = [...origins, ...destinations];
		const coordsString = allCoords
			.map((c) => `${c.longitude},${c.latitude}`)
			.join(';');

		// Build sources and destinations indices
		const sourceIndices = origins.map((_, i) => i).join(';');
		const destIndices = destinations.map((_, i) => origins.length + i).join(';');

		// Build URL
		const url = new URL(`${this.baseUrl}/${profile}/${coordsString}`);
		url.searchParams.set('access_token', this.mapboxToken);
		url.searchParams.set('sources', sourceIndices);
		url.searchParams.set('destinations', destIndices);
		if (includeDistance) {
			url.searchParams.set('annotations', 'duration,distance');
		}

		this.logger.debug(
			`Matrix API: ${origins.length} origins x ${destinations.length} destinations`,
		);

		try {
			const response = await fetch(url.toString());

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Matrix API error (${response.status}): ${errorText}`);
			}

			const data: MatrixResponse = await response.json();

			if (data.code !== 'Ok') {
				throw new Error(`Matrix API failed: ${data.message || data.code}`);
			}

			// Cache the result
			this.cache.set(cacheKey, {
				data,
				expiresAt: Date.now() + this.cacheTtl,
			});

			return data;
		} catch (error) {
			this.logger.error(`Matrix API failed: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Calculate fare based on distance and time
	 */
	private calculateFare(distanceKm: number, durationMinutes: number): FareBreakdown {
		const distanceFare = distanceKm * this.FARE_PER_KM_GHS;
		const timeFare = durationMinutes * this.FARE_PER_MIN_GHS;
		const subtotal = this.FARE_BASE_GHS + distanceFare + timeFare;

		// TODO: Apply surge pricing based on demand
		const surgeMultiplier = 1.0;

		// TODO: Apply discounts based on user status/promos
		const discount = 0;

		const total = Math.round((subtotal * surgeMultiplier - discount) * 100) / 100;

		return {
			baseFare: this.FARE_BASE_GHS,
			distanceFare: Math.round(distanceFare * 100) / 100,
			timeFare: Math.round(timeFare * 100) / 100,
			surgeMultiplier,
			subtotal: Math.round(subtotal * 100) / 100,
			discount,
			total,
			currency: 'GHS',
		};
	}

	/**
	 * Generate cache key for matrix request
	 */
	private getMatrixCacheKey(
		origins: GeoCoordinate[],
		destinations: GeoCoordinate[],
		profile: string,
	): string {
		// Round coordinates for cache grouping
		const originHash = origins
			.map((c) => `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`)
			.join('|');
		const destHash = destinations
			.map((c) => `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`)
			.join('|');
		return `matrix:${profile}:${originHash}:${destHash}`;
	}
}
