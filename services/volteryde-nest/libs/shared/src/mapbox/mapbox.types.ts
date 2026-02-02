// ============================================================================
// Mapbox Service Types
// ============================================================================
// Type definitions for Mapbox-native spatial operations
// These types support the bus-stop-to-bus-stop architecture

/**
 * Geographic coordinate (WGS84)
 */
export interface GeoCoordinate {
	latitude: number;
	longitude: number;
}

/**
 * Result from snapping user GPS to nearest bus stop
 */
export interface SnapResult {
	/** The stop that the user was snapped to */
	stopId: string;
	/** Display name of the stop */
	stopName: string;
	/** Stop code (short identifier) */
	stopCode?: string;
	/** Exact coordinates of the stop */
	location: GeoCoordinate;
	/** Walking distance from user's original location in meters */
	walkingDistanceMeters: number;
	/** Estimated walking time in seconds */
	walkingTimeSeconds: number;
	/** Whether this stop is currently active for pickups */
	isActive: boolean;
	/** Additional stop metadata */
	metadata?: StopMetadata;
}

/**
 * Stop metadata from tileset properties
 */
export interface StopMetadata {
	zoneId?: string;
	isChargingStation?: boolean;
	wheelchairAccessible?: boolean;
	routesServed?: string[];
	amenities?: string[];
}

/**
 * Error thrown when user is not near any bus stop
 */
export class ServiceVoidError extends Error {
	constructor(
		public readonly location: GeoCoordinate,
		public readonly searchRadiusMeters: number,
	) {
		super(
			`No bus stops found within ${searchRadiusMeters}m of location (${location.latitude}, ${location.longitude})`,
		);
		this.name = 'ServiceVoidError';
	}
}

/**
 * Mapbox Tilequery API response
 */
export interface TilequeryResponse {
	type: 'FeatureCollection';
	features: TilequeryFeature[];
}

/**
 * Individual feature from Tilequery response
 */
export interface TilequeryFeature {
	type: 'Feature';
	geometry: {
		type: 'Point';
		coordinates: [number, number]; // [lng, lat]
	};
	properties: {
		stop_id: string;
		stop_name: string;
		stop_code?: string;
		zone_id?: string;
		is_active?: boolean;
		is_charging_station?: boolean;
		wheelchair_accessible?: boolean;
		routes_served?: string[];
		amenities?: string[];
		tilequery: {
			distance: number; // meters from query point
			geometry: string;
			layer: string;
		};
	};
}

/**
 * Mapbox Matrix API request
 */
export interface MatrixRequest {
	/** Origin coordinates (usually candidate pickup stops) */
	origins: GeoCoordinate[];
	/** Destination coordinates (usually candidate dropoff stops) */
	destinations: GeoCoordinate[];
	/** Routing profile */
	profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
	/** Whether to include distance in response */
	includeDistance?: boolean;
}

/**
 * Mapbox Matrix API response
 */
export interface MatrixResponse {
	code: string;
	durations: number[][]; // seconds, origins x destinations
	distances?: number[][]; // meters, origins x destinations
	message?: string;
}

/**
 * Result from matchmaker service - optimal stop pair
 */
export interface StopPairResult {
	/** Optimal pickup stop */
	pickupStop: SnapResult;
	/** Optimal dropoff stop */
	dropoffStop: SnapResult;
	/** Driving distance between stops in meters */
	drivingDistanceMeters: number;
	/** Driving duration between stops in seconds */
	drivingDurationSeconds: number;
	/** Total walking time (to pickup + from dropoff) in seconds */
	totalWalkingTimeSeconds: number;
	/** Why this pair was selected */
	selectionReason: 'shortest_total_time' | 'shortest_walk' | 'only_option';
}

/**
 * Mapbox Directions API route leg
 */
export interface RouteLeg {
	/** Distance in meters */
	distance: number;
	/** Duration in seconds */
	duration: number;
	/** Route geometry (encoded polyline or GeoJSON) */
	geometry: string;
	/** Turn-by-turn steps */
	steps?: RouteStep[];
}

/**
 * Turn-by-turn navigation step
 */
export interface RouteStep {
	/** Distance for this step in meters */
	distance: number;
	/** Duration for this step in seconds */
	duration: number;
	/** Human-readable instruction */
	instruction: string;
	/** Maneuver type (turn-left, turn-right, arrive, etc.) */
	maneuverType: string;
	/** Maneuver modifier (slight, sharp, etc.) */
	maneuverModifier?: string;
	/** Location of the maneuver [lng, lat] */
	maneuverLocation: [number, number];
	/** Street name */
	name?: string;
}

/**
 * Complete route result from navigator service
 */
export interface NavigationRoute {
	/** Pickup stop details */
	pickupStop: {
		stopId: string;
		stopName: string;
		location: GeoCoordinate;
	};
	/** Dropoff stop details */
	dropoffStop: {
		stopId: string;
		stopName: string;
		location: GeoCoordinate;
	};
	/** Route from current location to pickup (if driver is en route) */
	toPickupLeg?: RouteLeg;
	/** Route from pickup to dropoff */
	tripLeg: RouteLeg;
	/** Total distance in meters */
	totalDistanceMeters: number;
	/** Total duration in seconds */
	totalDurationSeconds: number;
	/** ETA at pickup stop */
	etaPickup?: Date;
	/** ETA at dropoff stop */
	etaDropoff?: Date;
}

/**
 * Fare breakdown from pricing calculation
 */
export interface FareBreakdown {
	/** Base fare in currency units */
	baseFare: number;
	/** Distance-based fare component */
	distanceFare: number;
	/** Time-based fare component */
	timeFare: number;
	/** Any surge multiplier applied */
	surgeMultiplier: number;
	/** Total fare before discounts */
	subtotal: number;
	/** Any discounts applied */
	discount: number;
	/** Final fare amount */
	total: number;
	/** Currency code (e.g., 'GHS') */
	currency: string;
}

/**
 * Fare estimate request
 */
export interface FareEstimateRequest {
	pickupStopId: string;
	dropoffStopId: string;
	passengerCount?: number;
	paymentMethod?: string;
}

/**
 * Fare estimate result
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
	/** Distance between stops in kilometers */
	distanceKm: number;
	/** Estimated duration in minutes */
	durationMinutes: number;
	/** Fare breakdown */
	fare: FareBreakdown;
	/** Validity period for this estimate */
	validUntil: Date;
}

/**
 * Configuration for Mapbox services
 */
export interface MapboxConfig {
	/** Mapbox access token */
	accessToken: string;
	/** Tileset ID for bus stops (e.g., 'volteryde.stops') */
	stopsTilesetId: string;
	/** Default search radius for stop snapping in meters */
	defaultSnapRadiusMeters: number;
	/** Maximum allowed search radius in meters */
	maxSnapRadiusMeters: number;
	/** Cache TTL for tilequery results in seconds */
	tilequeryCacheTtlSeconds: number;
	/** Cache TTL for matrix results in seconds */
	matrixCacheTtlSeconds: number;
}

/**
 * Constants for walking assumptions
 */
export const WALKING_ASSUMPTIONS = {
	/** Average walking speed in meters per second */
	SPEED_MPS: 1.4, // ~5 km/h
	/** Maximum acceptable walking distance in meters */
	MAX_DISTANCE_M: 1500,
	/** Comfortable walking distance in meters */
	COMFORTABLE_DISTANCE_M: 500,
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_MAPBOX_CONFIG: Partial<MapboxConfig> = {
	stopsTilesetId: 'volteryde.stops',
	defaultSnapRadiusMeters: 500,
	maxSnapRadiusMeters: 1500,
	tilequeryCacheTtlSeconds: 60,
	matrixCacheTtlSeconds: 300,
};
