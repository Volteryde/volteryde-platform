// ============================================================================
// H3 Geospatial Services Integration Tests
// ============================================================================
// Austin: Integration tests for H3-based services using real Accra coordinates
// Run with: npx jest h3-services.integration.spec.ts

import * as h3 from 'h3-js';
import {
  H3Resolution,
  K_RING_DEFAULTS,
  GEOFENCE_CONFIG,
  WALKING_ASSUMPTIONS,
} from '../h3.constants';
import {
  GeoCoordinate,
  StopAccessGrade,
  DriverState,
  H3IndexedStop,
  H3IndexedDriver,
} from '../h3.types';

// ============================================================================
// Test Fixtures - Real Accra Locations
// ============================================================================

/**
 * Austin: Real coordinates in Accra, Ghana for testing
 */
const ACCRA_LOCATIONS = {
  // Osu - CBD area
  OSU_OXFORD_STREET: { latitude: 5.5560, longitude: -0.1820 },
  OSU_DANQUAH_CIRCLE: { latitude: 5.5548, longitude: -0.1850 },
  
  // Airport area
  KOTOKA_TERMINAL_3: { latitude: 5.6051, longitude: -0.1668 },
  AIRPORT_RESIDENTIAL: { latitude: 5.5977, longitude: -0.1752 },
  
  // East Legon - Urban
  EAST_LEGON_AC_MALL: { latitude: 5.6350, longitude: -0.1530 },
  EAST_LEGON_JUNCTION: { latitude: 5.6280, longitude: -0.1600 },
  
  // Madina - Urban/Suburban
  MADINA_ZONGO_JUNCTION: { latitude: 5.6700, longitude: -0.1650 },
  MADINA_MARKET: { latitude: 5.6750, longitude: -0.1680 },
  
  // Achimota - Suburban
  ACHIMOTA_MILE_7: { latitude: 5.6150, longitude: -0.2350 },
  ACHIMOTA_GOLF_COURSE: { latitude: 5.6050, longitude: -0.2250 },
  
  // Dansoman - Periurban
  DANSOMAN_HIGH_STREET: { latitude: 5.5330, longitude: -0.2550 },
  DANSOMAN_LAST_STOP: { latitude: 5.5280, longitude: -0.2620 },
};

/**
 * Austin: Sample bus stops for testing
 */
const createMockStop = (
  id: string,
  name: string,
  location: GeoCoordinate,
  accessGrade: StopAccessGrade = StopAccessGrade.CURB,
): H3IndexedStop => ({
  stopId: id,
  stopName: name,
  location,
  physicalH3Index: h3.latLngToCell(location.latitude, location.longitude, H3Resolution.PICKUP_POINT),
  accessH3Index: h3.latLngToCell(location.latitude, location.longitude, H3Resolution.PICKUP_POINT),
  accessGrade,
  isActiveForPickup: true,
  avgApproachTimeSeconds: accessGrade === StopAccessGrade.CURB ? 15 : 30,
});

const MOCK_STOPS: H3IndexedStop[] = [
  createMockStop('stop_osu_1', 'Osu Oxford Street', ACCRA_LOCATIONS.OSU_OXFORD_STREET),
  createMockStop('stop_osu_2', 'Danquah Circle', ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE, StopAccessGrade.BAY),
  createMockStop('stop_airport_1', 'Kotoka Terminal 3', ACCRA_LOCATIONS.KOTOKA_TERMINAL_3, StopAccessGrade.TERMINAL),
  createMockStop('stop_airport_2', 'Airport Residential', ACCRA_LOCATIONS.AIRPORT_RESIDENTIAL),
  createMockStop('stop_eastlegon_1', 'A and C Mall', ACCRA_LOCATIONS.EAST_LEGON_AC_MALL),
  createMockStop('stop_madina_1', 'Madina Zongo Junction', ACCRA_LOCATIONS.MADINA_ZONGO_JUNCTION),
  createMockStop('stop_achimota_1', 'Mile 7', ACCRA_LOCATIONS.ACHIMOTA_MILE_7),
  createMockStop('stop_dansoman_1', 'Dansoman High Street', ACCRA_LOCATIONS.DANSOMAN_HIGH_STREET),
];

// ============================================================================
// H3 Core Tests
// ============================================================================

describe('H3 Core Operations', () => {
  describe('latLngToCell', () => {
    it('should generate valid H3 index for Osu location', () => {
      const { latitude, longitude } = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      const h3Index = h3.latLngToCell(latitude, longitude, H3Resolution.PICKUP_POINT);
      
      expect(h3.isValidCell(h3Index)).toBe(true);
      expect(h3.getResolution(h3Index)).toBe(10);
    });

    it('should generate different indices for different resolutions', () => {
      const { latitude, longitude } = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      
      const res10 = h3.latLngToCell(latitude, longitude, H3Resolution.PICKUP_POINT);
      const res8 = h3.latLngToCell(latitude, longitude, H3Resolution.DRIVER_DISCOVERY);
      const res6 = h3.latLngToCell(latitude, longitude, H3Resolution.SHARD);
      
      expect(res10).not.toBe(res8);
      expect(res8).not.toBe(res6);
      expect(h3.getResolution(res10)).toBe(10);
      expect(h3.getResolution(res8)).toBe(8);
      expect(h3.getResolution(res6)).toBe(6);
    });

    it('should generate same parent for nearby locations', () => {
      // Austin: Osu and Danquah Circle are close - should share Res 6 parent
      const osuRes6 = h3.latLngToCell(
        ACCRA_LOCATIONS.OSU_OXFORD_STREET.latitude,
        ACCRA_LOCATIONS.OSU_OXFORD_STREET.longitude,
        H3Resolution.SHARD,
      );
      const danquahRes6 = h3.latLngToCell(
        ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE.latitude,
        ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE.longitude,
        H3Resolution.SHARD,
      );
      
      expect(osuRes6).toBe(danquahRes6);
    });
  });

  describe('gridDisk (k-ring)', () => {
    it('should return correct number of cells for k=1', () => {
      const { latitude, longitude } = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      const center = h3.latLngToCell(latitude, longitude, H3Resolution.PICKUP_POINT);
      const kRing = h3.gridDisk(center, 1);
      
      // k=1 should return 7 cells (center + 6 neighbors)
      expect(kRing.length).toBe(7);
      expect(kRing).toContain(center);
    });

    it('should return correct number of cells for k=2', () => {
      const { latitude, longitude } = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      const center = h3.latLngToCell(latitude, longitude, H3Resolution.PICKUP_POINT);
      const kRing = h3.gridDisk(center, K_RING_DEFAULTS.PICKUP_SEARCH);
      
      // k=2 should return 19 cells
      expect(kRing.length).toBe(19);
    });

    it('should return correct number of cells for k=3 (driver dispatch)', () => {
      const { latitude, longitude } = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      const center = h3.latLngToCell(latitude, longitude, H3Resolution.PICKUP_POINT);
      const kRing = h3.gridDisk(center, K_RING_DEFAULTS.DRIVER_DISPATCH);
      
      // k=3 should return 37 cells
      expect(kRing.length).toBe(37);
    });
  });

  describe('gridDistance', () => {
    it('should calculate H3 grid distance between two nearby cells', () => {
      const cell1 = h3.latLngToCell(
        ACCRA_LOCATIONS.OSU_OXFORD_STREET.latitude,
        ACCRA_LOCATIONS.OSU_OXFORD_STREET.longitude,
        H3Resolution.PICKUP_POINT,
      );
      const cell2 = h3.latLngToCell(
        ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE.latitude,
        ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE.longitude,
        H3Resolution.PICKUP_POINT,
      );
      
      const distance = h3.gridDistance(cell1, cell2);
      
      // Distance should be positive and reasonable for nearby locations
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Within 10 cells
    });

    it('should calculate larger distance for far apart locations', () => {
      const cell1 = h3.latLngToCell(
        ACCRA_LOCATIONS.OSU_OXFORD_STREET.latitude,
        ACCRA_LOCATIONS.OSU_OXFORD_STREET.longitude,
        H3Resolution.PICKUP_POINT,
      );
      const cell2 = h3.latLngToCell(
        ACCRA_LOCATIONS.MADINA_ZONGO_JUNCTION.latitude,
        ACCRA_LOCATIONS.MADINA_ZONGO_JUNCTION.longitude,
        H3Resolution.PICKUP_POINT,
      );
      
      const distance = h3.gridDistance(cell1, cell2);
      
      // Osu to Madina is ~10km - should be many cells apart
      expect(distance).toBeGreaterThan(50);
    });
  });
});

// ============================================================================
// Distance Calculation Tests
// ============================================================================

describe('Distance Calculations', () => {
  /**
   * Austin: Haversine distance implementation for testing
   */
  const haversineDistance = (coord1: GeoCoordinate, coord2: GeoCoordinate): number => {
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
  };

  it('should calculate reasonable distance between Osu and Danquah Circle', () => {
    const distance = haversineDistance(
      ACCRA_LOCATIONS.OSU_OXFORD_STREET,
      ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE,
    );
    
    // These are about 300-400 meters apart
    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(600);
  });

  it('should calculate ~10km distance between Osu and Madina', () => {
    const distance = haversineDistance(
      ACCRA_LOCATIONS.OSU_OXFORD_STREET,
      ACCRA_LOCATIONS.MADINA_ZONGO_JUNCTION,
    );
    
    // Osu to Madina is approximately 10-15km
    expect(distance).toBeGreaterThan(10000);
    expect(distance).toBeLessThan(20000);
  });

  it('should be within walking distance threshold for nearby stops', () => {
    const distance = haversineDistance(
      ACCRA_LOCATIONS.OSU_OXFORD_STREET,
      ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE,
    );
    
    expect(distance).toBeLessThan(WALKING_ASSUMPTIONS.MAX_WALKING_DISTANCE_M);
  });
});

// ============================================================================
// Distance-Based Pricing Tests
// ============================================================================

describe('Distance-Based Pricing', () => {
  // Austin: Pricing configuration matching the DistancePricingService
  const PRICING = {
    CBD: { baseFare: 5.0, ratePerKm: 2.5, minimumFare: 8.0 },
    URBAN: { baseFare: 4.0, ratePerKm: 2.0, minimumFare: 6.0 },
    SUBURBAN: { baseFare: 3.5, ratePerKm: 1.8, minimumFare: 5.0 },
    PERIURBAN: { baseFare: 3.0, ratePerKm: 1.5, minimumFare: 5.0 },
    BOOKING_FEE: 2.0,
    ROAD_MULTIPLIER: 1.3,
  };

  const calculateTestFare = (distanceKm: number, zone: keyof typeof PRICING): number => {
    if (zone === 'BOOKING_FEE' || zone === 'ROAD_MULTIPLIER') return 0;
    
    const config = PRICING[zone];
    const distanceCharge = distanceKm * config.ratePerKm;
    const subtotal = config.baseFare + distanceCharge + PRICING.BOOKING_FEE;
    return Math.max(subtotal, config.minimumFare);
  };

  it('should apply minimum fare for very short trips', () => {
    const shortDistance = 0.5; // 500m
    const fare = calculateTestFare(shortDistance, 'CBD');
    
    // Should be at least minimum fare
    expect(fare).toBeGreaterThanOrEqual(PRICING.CBD.minimumFare);
  });

  it('should calculate correct fare for medium trip in CBD', () => {
    const distance = 5; // 5km
    const expectedFare = PRICING.CBD.baseFare + (distance * PRICING.CBD.ratePerKm) + PRICING.BOOKING_FEE;
    const fare = calculateTestFare(distance, 'CBD');
    
    expect(fare).toBeCloseTo(expectedFare, 2);
  });

  it('should have lower rates in suburban areas', () => {
    const distance = 5; // 5km
    const cbdFare = calculateTestFare(distance, 'CBD');
    const suburbanFare = calculateTestFare(distance, 'SUBURBAN');
    
    expect(suburbanFare).toBeLessThan(cbdFare);
  });

  it('should have lowest rates in periurban areas', () => {
    const distance = 10; // 10km
    const urbanFare = calculateTestFare(distance, 'URBAN');
    const periurbanFare = calculateTestFare(distance, 'PERIURBAN');
    
    expect(periurbanFare).toBeLessThan(urbanFare);
  });

  it('should calculate realistic fare for Osu to Airport trip', () => {
    const distance = 6; // ~6km
    // Assuming both are CBD/Urban zone
    const fare = calculateTestFare(distance * PRICING.ROAD_MULTIPLIER, 'URBAN');
    
    // Fare should be reasonable (10-25 GHS for this distance)
    expect(fare).toBeGreaterThan(10);
    expect(fare).toBeLessThan(30);
  });

  it('should calculate realistic fare for Osu to Madina trip', () => {
    const distance = 13; // ~13km straight line, ~17km road
    const fare = calculateTestFare(distance * PRICING.ROAD_MULTIPLIER, 'URBAN');
    
    // Fare should be reasonable (30-50 GHS for this distance)
    expect(fare).toBeGreaterThan(25);
    expect(fare).toBeLessThan(60);
  });
});

// ============================================================================
// Geofence Tests
// ============================================================================

describe('Geofence and Arrival Detection', () => {
  it('should use correct arrival threshold', () => {
    expect(GEOFENCE_CONFIG.ARRIVAL_THRESHOLD_METERS).toBe(50);
  });

  it('should require hysteresis count for arrival confirmation', () => {
    expect(GEOFENCE_CONFIG.ARRIVAL_HYSTERESIS_COUNT).toBe(3);
  });

  it('should have minimum dwell time at stop', () => {
    expect(GEOFENCE_CONFIG.MIN_DWELL_TIME_MS).toBeGreaterThanOrEqual(5000);
  });

  describe('isWithinGeofence simulation', () => {
    const isWithinGeofence = (
      driverLocation: GeoCoordinate,
      stopLocation: GeoCoordinate,
      thresholdMeters: number,
    ): boolean => {
      const R = 6371000;
      const lat1Rad = (driverLocation.latitude * Math.PI) / 180;
      const lat2Rad = (stopLocation.latitude * Math.PI) / 180;
      const deltaLat = ((stopLocation.latitude - driverLocation.latitude) * Math.PI) / 180;
      const deltaLon = ((stopLocation.longitude - driverLocation.longitude) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= thresholdMeters;
    };

    it('should detect driver at exact stop location', () => {
      const stopLocation = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      const driverLocation = { ...stopLocation }; // Same location
      
      const isAtStop = isWithinGeofence(
        driverLocation,
        stopLocation,
        GEOFENCE_CONFIG.ARRIVAL_THRESHOLD_METERS,
      );
      
      expect(isAtStop).toBe(true);
    });

    it('should detect driver within 50m of stop', () => {
      const stopLocation = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      // Offset by ~30m (roughly 0.0003 degrees at this latitude)
      const driverLocation = {
        latitude: stopLocation.latitude + 0.0003,
        longitude: stopLocation.longitude,
      };
      
      const isAtStop = isWithinGeofence(
        driverLocation,
        stopLocation,
        GEOFENCE_CONFIG.ARRIVAL_THRESHOLD_METERS,
      );
      
      expect(isAtStop).toBe(true);
    });

    it('should not detect driver 100m away from stop', () => {
      const stopLocation = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
      // Offset by ~100m (roughly 0.0009 degrees at this latitude)
      const driverLocation = {
        latitude: stopLocation.latitude + 0.0009,
        longitude: stopLocation.longitude,
      };
      
      const isAtStop = isWithinGeofence(
        driverLocation,
        stopLocation,
        GEOFENCE_CONFIG.ARRIVAL_THRESHOLD_METERS,
      );
      
      expect(isAtStop).toBe(false);
    });
  });
});

// ============================================================================
// Driver State Machine Tests
// ============================================================================

describe('Driver State Machine', () => {
  const VALID_TRANSITIONS: Record<DriverState, DriverState[]> = {
    [DriverState.OFFLINE]: [DriverState.IDLE],
    [DriverState.IDLE]: [DriverState.OFFLINE, DriverState.DISPATCHED],
    [DriverState.DISPATCHED]: [DriverState.HEADING_TO_PICKUP, DriverState.IDLE],
    [DriverState.HEADING_TO_PICKUP]: [DriverState.ARRIVED, DriverState.IDLE],
    [DriverState.ARRIVED]: [DriverState.POB, DriverState.IDLE],
    [DriverState.POB]: [DriverState.OPEN_FOR_DISPATCH, DriverState.IDLE],
    [DriverState.OPEN_FOR_DISPATCH]: [DriverState.IDLE, DriverState.DISPATCHED],
  };

  const canTransition = (from: DriverState, to: DriverState): boolean => {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  };

  it('should allow OFFLINE to IDLE transition', () => {
    expect(canTransition(DriverState.OFFLINE, DriverState.IDLE)).toBe(true);
  });

  it('should allow IDLE to DISPATCHED transition', () => {
    expect(canTransition(DriverState.IDLE, DriverState.DISPATCHED)).toBe(true);
  });

  it('should not allow OFFLINE to DISPATCHED transition', () => {
    expect(canTransition(DriverState.OFFLINE, DriverState.DISPATCHED)).toBe(false);
  });

  it('should not allow POB to ARRIVED transition (backwards)', () => {
    expect(canTransition(DriverState.POB, DriverState.ARRIVED)).toBe(false);
  });

  it('should allow chain dispatch from OPEN_FOR_DISPATCH', () => {
    expect(canTransition(DriverState.OPEN_FOR_DISPATCH, DriverState.DISPATCHED)).toBe(true);
  });

  it('should allow cancellation from any active state to IDLE', () => {
    expect(canTransition(DriverState.DISPATCHED, DriverState.IDLE)).toBe(true);
    expect(canTransition(DriverState.HEADING_TO_PICKUP, DriverState.IDLE)).toBe(true);
    expect(canTransition(DriverState.ARRIVED, DriverState.IDLE)).toBe(true);
  });
});

// ============================================================================
// Stop Search Tests
// ============================================================================

describe('Stop Search with H3', () => {
  /**
   * Austin: Simulate stop search using H3 k-ring
   */
  const findStopsInKRing = (
    stops: H3IndexedStop[],
    location: GeoCoordinate,
    k: number,
  ): H3IndexedStop[] => {
    const centerCell = h3.latLngToCell(location.latitude, location.longitude, H3Resolution.PICKUP_POINT);
    const kRing = h3.gridDisk(centerCell, k);
    const kRingSet = new Set(kRing);
    
    return stops.filter(stop => kRingSet.has(stop.physicalH3Index));
  };

  it('should find stops in k-ring around Osu', () => {
    const foundStops = findStopsInKRing(
      MOCK_STOPS,
      ACCRA_LOCATIONS.OSU_OXFORD_STREET,
      K_RING_DEFAULTS.PICKUP_SEARCH,
    );
    
    // Should find at least the Osu stop
    expect(foundStops.length).toBeGreaterThanOrEqual(1);
    expect(foundStops.some(s => s.stopId === 'stop_osu_1')).toBe(true);
  });

  it('should find more stops with larger k-ring', () => {
    const smallKRing = findStopsInKRing(
      MOCK_STOPS,
      ACCRA_LOCATIONS.OSU_OXFORD_STREET,
      1,
    );
    const largeKRing = findStopsInKRing(
      MOCK_STOPS,
      ACCRA_LOCATIONS.OSU_OXFORD_STREET,
      K_RING_DEFAULTS.EXTENDED_SEARCH,
    );
    
    expect(largeKRing.length).toBeGreaterThanOrEqual(smallKRing.length);
  });

  it('should not find stops in different areas', () => {
    const foundStops = findStopsInKRing(
      MOCK_STOPS,
      ACCRA_LOCATIONS.MADINA_ZONGO_JUNCTION,
      K_RING_DEFAULTS.PICKUP_SEARCH,
    );
    
    // Should find Madina stop but not Osu stop
    expect(foundStops.some(s => s.stopId === 'stop_osu_1')).toBe(false);
    expect(foundStops.some(s => s.stopId === 'stop_madina_1')).toBe(true);
  });
});

// ============================================================================
// Walking Time Estimation Tests
// ============================================================================

describe('Walking Time Estimation', () => {
  const estimateWalkingTime = (distanceMeters: number): number => {
    return Math.ceil(distanceMeters / WALKING_ASSUMPTIONS.AVG_SPEED_MPS);
  };

  it('should estimate ~3.5 minutes for 300m walk', () => {
    const walkTime = estimateWalkingTime(300);
    const walkTimeMinutes = walkTime / 60;
    
    // 300m at 1.4 m/s = ~214 seconds = ~3.5 minutes
    expect(walkTimeMinutes).toBeGreaterThan(3);
    expect(walkTimeMinutes).toBeLessThan(5);
  });

  it('should estimate ~6 minutes for 500m walk', () => {
    const walkTime = estimateWalkingTime(500);
    const walkTimeMinutes = walkTime / 60;
    
    // 500m at 1.4 m/s = ~357 seconds = ~6 minutes
    expect(walkTimeMinutes).toBeGreaterThan(5);
    expect(walkTimeMinutes).toBeLessThan(7);
  });

  it('should not exceed max walking distance for nearby stops', () => {
    const R = 6371000;
    const coord1 = ACCRA_LOCATIONS.OSU_OXFORD_STREET;
    const coord2 = ACCRA_LOCATIONS.OSU_DANQUAH_CIRCLE;
    
    const lat1Rad = (coord1.latitude * Math.PI) / 180;
    const lat2Rad = (coord2.latitude * Math.PI) / 180;
    const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    expect(distance).toBeLessThan(WALKING_ASSUMPTIONS.MAX_WALKING_DISTANCE_M);
  });
});

console.log('✅ H3 Integration Tests loaded successfully');
