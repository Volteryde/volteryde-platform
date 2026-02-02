// ============================================================================
// H3 Geospatial Types
// ============================================================================
// Austin: Type definitions for H3-based spatial operations
// These types ensure type safety across the dispatch and routing systems



/**
 * Austin: Core coordinate type with optional H3 indices
 */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Austin: Coordinate with pre-computed H3 indices at multiple resolutions
 * Avoids redundant H3 calculations during high-frequency operations
 */
export interface H3IndexedCoordinate extends GeoCoordinate {
  /** Resolution 10 H3 index - primary operating resolution */
  h3Res10: string;
  /** Resolution 8 H3 index - for driver discovery */
  h3Res8?: string;
  /** Resolution 6 H3 index - for sharding */
  h3Res6?: string;
}

/**
 * Austin: Bus stop with H3 spatial indices
 * Extends GTFS stop data with VolteRyde-specific fields
 */
export interface H3IndexedStop {
  stopId: string;
  stopName: string;
  location: GeoCoordinate;
  /** H3 index of the physical stop location */
  physicalH3Index: string;
  /** H3 index of the street access point (for curb pickups) */
  accessH3Index: string;
  /** Access type affects dwell time calculations */
  accessGrade: StopAccessGrade;
  /** Whether this stop is valid for VolteRyde pickups */
  isActiveForPickup: boolean;
  /** Cached walking approach time in seconds */
  avgApproachTimeSeconds?: number;
}

/**
 * Austin: Stop access grading for ETA buffer calculations
 */
export enum StopAccessGrade {
  /** Direct curb access - lowest dwell time */
  CURB = 'CURB',
  /** Dedicated bay - medium dwell time */
  BAY = 'BAY',
  /** Terminal with walking required - highest dwell time */
  TERMINAL = 'TERMINAL',
}

/**
 * Austin: Driver entity with H3 spatial tracking
 */
export interface H3IndexedDriver {
  driverId: string;
  vehicleId: string;
  currentLocation: H3IndexedCoordinate;
  state: DriverState;
  /** Last GPS update timestamp */
  lastUpdateTime: Date;
  /** Heading in degrees (0-360) */
  heading?: number;
  /** Speed in km/h */
  speed?: number;
  /** Current trip ID if in POB or DISPATCHED state */
  currentTripId?: string;
  /** Driver rating (1-5) */
  rating: number;
}

/**
 * Austin: Finite State Machine states for drivers
 * Strict state transitions prevent race conditions
 */
export enum DriverState {
  /** Not accepting rides */
  OFFLINE = 'OFFLINE',
  /** Online and in supply pool */
  IDLE = 'IDLE',
  /** Assigned to a trip, locked from other dispatches */
  DISPATCHED = 'DISPATCHED',
  /** En route to pickup stop */
  HEADING_TO_PICKUP = 'HEADING_TO_PICKUP',
  /** Arrived at pickup stop, waiting for passenger */
  ARRIVED = 'ARRIVED',
  /** Passenger on board, trip in progress */
  POB = 'POB',
  /** POB but near dropoff - eligible for chained dispatch */
  OPEN_FOR_DISPATCH = 'OPEN_FOR_DISPATCH',
}

/**
 * Austin: Valid state transitions for the driver FSM
 */
export const VALID_DRIVER_STATE_TRANSITIONS: Record<DriverState, DriverState[]> = {
  [DriverState.OFFLINE]: [DriverState.IDLE],
  [DriverState.IDLE]: [DriverState.OFFLINE, DriverState.DISPATCHED],
  [DriverState.DISPATCHED]: [DriverState.HEADING_TO_PICKUP, DriverState.IDLE], // IDLE if cancelled
  [DriverState.HEADING_TO_PICKUP]: [DriverState.ARRIVED, DriverState.IDLE], // IDLE if cancelled
  [DriverState.ARRIVED]: [DriverState.POB, DriverState.IDLE], // IDLE if no-show
  [DriverState.POB]: [DriverState.OPEN_FOR_DISPATCH, DriverState.IDLE], // IDLE after dropoff
  [DriverState.OPEN_FOR_DISPATCH]: [DriverState.IDLE, DriverState.DISPATCHED], // Chain dispatch or complete
};

/**
 * Austin: Trip state machine
 */
export enum TripState {
  /** Booking requested, awaiting dispatch */
  REQUESTED = 'REQUESTED',
  /** Driver assigned, awaiting confirmation */
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  /** Driver en route to pickup */
  DRIVER_EN_ROUTE = 'DRIVER_EN_ROUTE',
  /** Driver arrived at pickup */
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  /** Trip in progress */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Trip completed successfully */
  COMPLETED = 'COMPLETED',
  /** Trip cancelled by rider */
  CANCELLED_BY_RIDER = 'CANCELLED_BY_RIDER',
  /** Trip cancelled by driver */
  CANCELLED_BY_DRIVER = 'CANCELLED_BY_DRIVER',
  /** No driver found */
  NO_DRIVERS_AVAILABLE = 'NO_DRIVERS_AVAILABLE',
}

/**
 * Austin: K-ring search result with distance metadata
 */
export interface KRingSearchResult<T> {
  items: T[];
  /** The H3 cells that were searched */
  searchedCells: string[];
  /** The k value used for the search */
  kValue: number;
  /** Approximate radius covered in meters */
  radiusMeters: number;
}

/**
 * Austin: Smart snap result - optimal stop selection
 */
export interface SmartSnapResult {
  /** The selected optimal stop */
  stop: H3IndexedStop;
  /** Walking time from user to stop in seconds */
  walkingTimeSeconds: number;
  /** Walking distance in meters */
  walkingDistanceMeters: number;
  /** Total cost score (lower is better) */
  costScore: number;
  /** All candidate stops considered */
  candidates: StopCandidate[];
}

/**
 * Austin: Stop candidate with computed costs
 */
export interface StopCandidate {
  stop: H3IndexedStop;
  walkingTimeSeconds: number;
  walkingDistanceMeters: number;
  /** Estimated drive time from this stop to destination */
  driveTimeSeconds?: number;
  /** Safety penalty (higher = less safe) */
  safetyPenalty: number;
  /** Crowding penalty (higher = more congested) */
  crowdingPenalty: number;
  /** Total computed cost */
  totalCost: number;
}

/**
 * Austin: Multimodal route - Walk-Drive-Walk stitched trip
 */
export interface StitchedRoute {
  /** Walk from origin to pickup stop */
  leg1Walk: RouteLeg;
  /** Drive from pickup stop to dropoff stop */
  leg2Drive: RouteLeg;
  /** Walk from dropoff stop to final destination */
  leg3Walk: RouteLeg;
  /** Total trip time in seconds */
  totalTimeSeconds: number;
  /** Total distance in meters */
  totalDistanceMeters: number;
  /** Estimated fare in local currency */
  estimatedFare: number;
  /** Selected pickup stop */
  pickupStop: H3IndexedStop;
  /** Selected dropoff stop */
  dropoffStop: H3IndexedStop;
}

/**
 * Austin: Individual route leg
 */
export interface RouteLeg {
  /** Start coordinate */
  origin: GeoCoordinate;
  /** End coordinate */
  destination: GeoCoordinate;
  /** Duration in seconds */
  durationSeconds: number;
  /** Distance in meters */
  distanceMeters: number;
  /** Encoded polyline for map rendering */
  geometry?: string;
  /** Mode of transport */
  mode: 'walking' | 'driving';
}

/**
 * Austin: Matching cost matrix element
 */
export interface MatchingCostEntry {
  riderId: string;
  driverId: string;
  /** ETA in seconds */
  etaSeconds: number;
  /** Estimated fare */
  fare: number;
  /** Driver rating (1-5) */
  driverRating: number;
  /** Computed cost (lower is better) */
  cost: number;
}

/**
 * Austin: Batched matching result
 */
export interface BatchMatchingResult {
  /** Optimal rider-driver assignments */
  assignments: Array<{
    riderId: string;
    driverId: string;
    cost: number;
  }>;
  /** Riders that couldn't be matched */
  unmatchedRiders: string[];
  /** Drivers that weren't assigned */
  unmatchedDrivers: string[];
  /** Total optimization cost */
  totalCost: number;
  /** Processing time in ms */
  processingTimeMs: number;
}

/**
 * Austin: GPS update with Kalman filter metadata
 */
export interface FilteredGPSUpdate {
  raw: GeoCoordinate;
  filtered: GeoCoordinate;
  h3Index: string;
  accuracy: number;
  timestamp: Date;
  /** Kalman filter velocity estimate */
  velocityMps?: number;
  /** Was this update smoothed significantly? */
  wasSmoothed: boolean;
}
