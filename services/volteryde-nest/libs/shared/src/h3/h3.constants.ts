// ============================================================================
// H3 Geospatial Constants
// ============================================================================
// Austin: Resolution strategy and configuration for VolteRyde's H3 system
// Based on architectural specification for urban mobility optimization

/**
 * Austin: H3 Resolution Configuration
 * 
 * Resolution 6:  ~3.2 km edge  → Database sharding key (city district)
 * Resolution 7:  ~1.2 km edge  → Surge pricing zones
 * Resolution 8:  ~460 m edge   → Driver discovery initial radius
 * Resolution 9:  ~174 m edge   → Traffic analysis segments
 * Resolution 10: ~66 m edge    → PRIMARY: Pickup points (bus stops)
 * Resolution 11: ~25 m edge    → Too fine, causes GPS flickering
 */
export enum H3Resolution {
  /** Sharding key for database partitioning - covers city districts */
  SHARD = 6,
  /** Surge pricing and demand aggregation zones */
  SURGE_PRICING = 7,
  /** Initial driver search radius (~500m effective) */
  DRIVER_DISCOVERY = 8,
  /** Traffic speed analysis granularity */
  TRAFFIC_ANALYSIS = 9,
  /** Primary operating resolution for all entities (stops, users, drivers) */
  PICKUP_POINT = 10,
  /** Too granular - GPS noise causes cell flickering */
  GPS_NOISE = 11,
}

/**
 * Austin: Default k-ring expansion values for proximity searches
 * k=1: center + 6 neighbors (~130m radius at Res 10)
 * k=2: center + 18 neighbors (~260m radius at Res 10)
 * k=3: center + 36 neighbors (~400m radius at Res 10)
 */
export const K_RING_DEFAULTS = {
  /** Standard pickup zone search */
  PICKUP_SEARCH: 2,
  /** Extended search when no stops found */
  EXTENDED_SEARCH: 3,
  /** Minimal search for dense areas */
  MINIMAL_SEARCH: 1,
  /** Driver proximity for dispatch */
  DRIVER_DISPATCH: 3,
} as const;

/**
 * Austin: Approximate radius in meters for k-ring at Resolution 10
 * Used for UI display and ETA estimation
 */
export const K_RING_RADIUS_METERS: Record<number, number> = {
  0: 33,    // Center cell only
  1: 130,   // ~2 blocks
  2: 260,   // ~4 blocks
  3: 400,   // ~6 blocks
  4: 530,   // ~8 blocks
  5: 660,   // ~10 blocks
};

/**
 * Austin: Geofence configuration for arrival detection
 * Uses hysteresis to prevent GPS flickering
 */
export const GEOFENCE_CONFIG = {
  /** Number of consecutive GPS updates required to confirm arrival */
  ARRIVAL_HYSTERESIS_COUNT: 3,
  /** Maximum distance (meters) to trigger arrival check */
  ARRIVAL_THRESHOLD_METERS: 50,
  /** Minimum dwell time (ms) at stop to confirm true arrival */
  MIN_DWELL_TIME_MS: 5000,
  /** GPS update interval expected from drivers (ms) */
  EXPECTED_GPS_INTERVAL_MS: 3000,
} as const;

/**
 * Austin: Walking speed assumptions for ETA calculations
 */
export const WALKING_ASSUMPTIONS = {
  /** Average walking speed in meters per second */
  AVG_SPEED_MPS: 1.4,
  /** Slow walking speed (elderly, encumbered) */
  SLOW_SPEED_MPS: 1.0,
  /** Fast walking speed */
  FAST_SPEED_MPS: 1.8,
  /** Maximum acceptable walking distance in meters */
  MAX_WALKING_DISTANCE_M: 500,
} as const;

/**
 * Austin: Driver state transition timeouts
 */
export const DRIVER_STATE_TIMEOUTS = {
  /** Max time (ms) for driver to acknowledge dispatch */
  DISPATCH_ACK_TIMEOUT_MS: 30000,
  /** Max time (ms) at pickup before auto-cancel consideration */
  MAX_WAIT_AT_PICKUP_MS: 300000,
  /** Time (ms) before dropoff when driver becomes OPEN_FOR_DISPATCH */
  OPEN_FOR_DISPATCH_THRESHOLD_MS: 120000,
} as const;

/**
 * Austin: Batched matching window configuration
 */
export const MATCHING_CONFIG = {
  /** Time window (ms) to accumulate requests before matching */
  BATCH_WINDOW_MS: 3000,
  /** Maximum requests in a single batch */
  MAX_BATCH_SIZE: 100,
  /** Weight for driver rating in cost function */
  RATING_WEIGHT: 0.1,
  /** Weight for ETA in cost function */
  ETA_WEIGHT: 0.6,
  /** Weight for price in cost function */
  PRICE_WEIGHT: 0.3,
} as const;

/**
 * Austin: Redis key patterns for H3-based spatial indexing
 */
export const REDIS_KEY_PATTERNS = {
  /** Stops in H3 cell: h3:{resolution}:{h3Index}:stops */
  STOPS_IN_CELL: (res: number, h3Index: string) => `h3:${res}:${h3Index}:stops`,
  /** Drivers in H3 cell: h3:{resolution}:{h3Index}:drivers */
  DRIVERS_IN_CELL: (res: number, h3Index: string) => `h3:${res}:${h3Index}:drivers`,
  /** Stop metadata: stop:{stopId}:meta */
  STOP_METADATA: (stopId: string) => `stop:${stopId}:meta`,
  /** Driver metadata: driver:{driverId}:meta */
  DRIVER_METADATA: (driverId: string) => `driver:${driverId}:meta`,
  /** Driver state: driver:{driverId}:state */
  DRIVER_STATE: (driverId: string) => `driver:${driverId}:state`,
  /** Active trip: trip:{tripId}:state */
  TRIP_STATE: (tripId: string) => `trip:${tripId}:state`,
} as const;
