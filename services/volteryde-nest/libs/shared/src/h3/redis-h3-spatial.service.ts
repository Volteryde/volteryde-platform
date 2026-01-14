// ============================================================================
// Redis H3 Spatial Index Service
// ============================================================================
// Austin: High-performance spatial indexing using H3 hexagonal cells
// Provides O(1) lookup for stops and drivers within H3 cells
// Uses Redis SETs and HASHes for real-time geospatial queries

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { H3Resolution, REDIS_KEY_PATTERNS, K_RING_DEFAULTS } from './h3.constants';
import {
  GeoCoordinate,
  H3IndexedStop,
  H3IndexedDriver,
  DriverState,
} from './h3.types';
import { getKRingCells, latLngToH3 } from './h3.utils';

/**
 * Austin: Driver metadata for Redis caching
 */
interface DriverRedisMetadata {
  driverId: string;
  vehicleId: string;
  lat: number;
  lng: number;
  h3Res10: string;
  state: DriverState;
  heading?: number;
  speed?: number;
  rating: number;
  currentTripId?: string;
  lastUpdate: number; // Unix timestamp
}

/**
 * Austin: Stop metadata for Redis caching
 */
interface StopRedisMetadata {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  h3Res10: string;
  accessGrade: string;
  isActiveForPickup: boolean;
  safetyScore: number;
}

@Injectable()
export class RedisH3SpatialService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisH3SpatialService.name);
  private redis: Redis;

  // Austin: TTL for driver position data (60 seconds)
  // Stale driver positions are auto-pruned
  private readonly DRIVER_TTL_SECONDS = 60;

  // Austin: TTL for stop data (1 hour - stops are static)
  private readonly STOP_TTL_SECONDS = 3600;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    
    // Austin: Connect to Redis with lazy connection for better error handling
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    try {
      await this.redis.connect();
      this.logger.log('Redis H3 Spatial Index connected');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis H3 Spatial Index disconnected');
  }

  // ============================================================================
  // Stop Indexing Operations
  // ============================================================================

  /**
   * Austin: Index a stop in Redis for O(1) H3 cell lookup
   * Creates both cell membership and metadata entries
   */
  async indexStop(stop: H3IndexedStop): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Add stop to H3 cell set (Res 10)
    const cellKey = REDIS_KEY_PATTERNS.STOPS_IN_CELL(H3Resolution.PICKUP_POINT, stop.physicalH3Index);
    pipeline.sadd(cellKey, stop.stopId);
    pipeline.expire(cellKey, this.STOP_TTL_SECONDS);

    // Store stop metadata
    const metaKey = REDIS_KEY_PATTERNS.STOP_METADATA(stop.stopId);
    const metadata: StopRedisMetadata = {
      stopId: stop.stopId,
      stopName: stop.stopName,
      lat: stop.location.latitude,
      lng: stop.location.longitude,
      h3Res10: stop.physicalH3Index,
      accessGrade: stop.accessGrade,
      isActiveForPickup: stop.isActiveForPickup,
      safetyScore: 50, // Default score, would be fetched from DB
    };
    pipeline.hset(metaKey, metadata as unknown as Record<string, string>);
    pipeline.expire(metaKey, this.STOP_TTL_SECONDS);

    await pipeline.exec();
    this.logger.debug(`Indexed stop ${stop.stopId} in cell ${stop.physicalH3Index}`);
  }

  /**
   * Austin: Batch index multiple stops (for initial data load)
   */
  async indexStopsBatch(stops: H3IndexedStop[]): Promise<number> {
    const pipeline = this.redis.pipeline();
    let indexed = 0;

    for (const stop of stops) {
      const cellKey = REDIS_KEY_PATTERNS.STOPS_IN_CELL(H3Resolution.PICKUP_POINT, stop.physicalH3Index);
      pipeline.sadd(cellKey, stop.stopId);
      pipeline.expire(cellKey, this.STOP_TTL_SECONDS);

      const metaKey = REDIS_KEY_PATTERNS.STOP_METADATA(stop.stopId);
      const metadata: StopRedisMetadata = {
        stopId: stop.stopId,
        stopName: stop.stopName,
        lat: stop.location.latitude,
        lng: stop.location.longitude,
        h3Res10: stop.physicalH3Index,
        accessGrade: stop.accessGrade,
        isActiveForPickup: stop.isActiveForPickup,
        safetyScore: 50,
      };
      pipeline.hset(metaKey, metadata as unknown as Record<string, string>);
      pipeline.expire(metaKey, this.STOP_TTL_SECONDS);
      indexed++;
    }

    await pipeline.exec();
    this.logger.log(`Batch indexed ${indexed} stops`);
    return indexed;
  }

  /**
   * Austin: Find stops near a coordinate using H3 k-ring query
   * This is the core proximity search - O(1) per cell lookup
   */
  async findStopsNearCoordinate(
    lat: number,
    lng: number,
    k: number = K_RING_DEFAULTS.PICKUP_SEARCH,
  ): Promise<H3IndexedStop[]> {
    const centerCell = latLngToH3(lat, lng, H3Resolution.PICKUP_POINT);
    const cells = getKRingCells(centerCell, k);

    // Multi-get all stop IDs from cells
    const pipeline = this.redis.pipeline();
    for (const cell of cells) {
      const cellKey = REDIS_KEY_PATTERNS.STOPS_IN_CELL(H3Resolution.PICKUP_POINT, cell);
      pipeline.smembers(cellKey);
    }

    const results = await pipeline.exec();
    const stopIds = new Set<string>();

    if (results) {
      for (const [err, members] of results) {
        if (!err && Array.isArray(members)) {
          members.forEach((id) => stopIds.add(id as string));
        }
      }
    }

    if (stopIds.size === 0) {
      return [];
    }

    // Fetch metadata for all found stops
    return this.getStopMetadataBatch(Array.from(stopIds));
  }

  /**
   * Austin: Get stop metadata from Redis
   */
  async getStopMetadata(stopId: string): Promise<H3IndexedStop | null> {
    const metaKey = REDIS_KEY_PATTERNS.STOP_METADATA(stopId);
    const data = await this.redis.hgetall(metaKey);

    if (!data || !data.stopId) {
      return null;
    }

    return this.parseStopMetadata(data);
  }

  /**
   * Austin: Batch fetch stop metadata
   */
  async getStopMetadataBatch(stopIds: string[]): Promise<H3IndexedStop[]> {
    const pipeline = this.redis.pipeline();
    
    for (const stopId of stopIds) {
      const metaKey = REDIS_KEY_PATTERNS.STOP_METADATA(stopId);
      pipeline.hgetall(metaKey);
    }

    const results = await pipeline.exec();
    const stops: H3IndexedStop[] = [];

    if (results) {
      for (const [err, data] of results) {
        if (!err && data && typeof data === 'object' && (data as Record<string, string>).stopId) {
          const stop = this.parseStopMetadata(data as Record<string, string>);
          if (stop.isActiveForPickup) {
            stops.push(stop);
          }
        }
      }
    }

    return stops;
  }

  private parseStopMetadata(data: Record<string, string>): H3IndexedStop {
    return {
      stopId: data.stopId,
      stopName: data.stopName,
      location: {
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lng),
      },
      physicalH3Index: data.h3Res10,
      accessH3Index: data.h3Res10, // Same for now
      accessGrade: data.accessGrade as H3IndexedStop['accessGrade'],
      isActiveForPickup: data.isActiveForPickup === 'true',
    };
  }

  // ============================================================================
  // Driver Supply Indexing Operations
  // ============================================================================

  /**
   * Austin: Update driver position in Redis spatial index
   * Called on every GPS update from the Supply Service
   */
  async updateDriverPosition(driver: H3IndexedDriver): Promise<void> {
    const pipeline = this.redis.pipeline();
    const h3Index = driver.currentLocation.h3Res10;

    // Austin: Remove driver from old cell if position changed
    // We need to track the previous cell to do this efficiently
    const prevCellKey = `driver:${driver.driverId}:prev_cell`;
    const prevCell = await this.redis.get(prevCellKey);
    
    if (prevCell && prevCell !== h3Index) {
      const oldCellKey = REDIS_KEY_PATTERNS.DRIVERS_IN_CELL(H3Resolution.PICKUP_POINT, prevCell);
      pipeline.srem(oldCellKey, driver.driverId);
    }

    // Add to new cell
    const cellKey = REDIS_KEY_PATTERNS.DRIVERS_IN_CELL(H3Resolution.PICKUP_POINT, h3Index);
    pipeline.sadd(cellKey, driver.driverId);
    pipeline.expire(cellKey, this.DRIVER_TTL_SECONDS);

    // Update previous cell tracker
    pipeline.set(prevCellKey, h3Index, 'EX', this.DRIVER_TTL_SECONDS);

    // Store driver metadata
    const metaKey = REDIS_KEY_PATTERNS.DRIVER_METADATA(driver.driverId);
    const metadata: DriverRedisMetadata = {
      driverId: driver.driverId,
      vehicleId: driver.vehicleId,
      lat: driver.currentLocation.latitude,
      lng: driver.currentLocation.longitude,
      h3Res10: h3Index,
      state: driver.state,
      heading: driver.heading,
      speed: driver.speed,
      rating: driver.rating,
      currentTripId: driver.currentTripId,
      lastUpdate: Date.now(),
    };
    pipeline.hset(metaKey, metadata as unknown as Record<string, string>);
    pipeline.expire(metaKey, this.DRIVER_TTL_SECONDS);

    // Update driver state
    const stateKey = REDIS_KEY_PATTERNS.DRIVER_STATE(driver.driverId);
    pipeline.set(stateKey, driver.state, 'EX', this.DRIVER_TTL_SECONDS);

    await pipeline.exec();
  }

  /**
   * Austin: Remove driver from supply pool (when going offline)
   */
  async removeDriverFromSupply(driverId: string): Promise<void> {
    const prevCellKey = `driver:${driverId}:prev_cell`;
    const prevCell = await this.redis.get(prevCellKey);

    const pipeline = this.redis.pipeline();

    if (prevCell) {
      const cellKey = REDIS_KEY_PATTERNS.DRIVERS_IN_CELL(H3Resolution.PICKUP_POINT, prevCell);
      pipeline.srem(cellKey, driverId);
    }

    pipeline.del(prevCellKey);
    pipeline.del(REDIS_KEY_PATTERNS.DRIVER_METADATA(driverId));
    pipeline.del(REDIS_KEY_PATTERNS.DRIVER_STATE(driverId));

    await pipeline.exec();
    this.logger.debug(`Removed driver ${driverId} from supply`);
  }

  /**
   * Austin: Find available drivers near a coordinate
   * Returns only drivers in IDLE or OPEN_FOR_DISPATCH state
   */
  async findAvailableDriversNear(
    lat: number,
    lng: number,
    k: number = K_RING_DEFAULTS.DRIVER_DISPATCH,
  ): Promise<H3IndexedDriver[]> {
    const centerCell = latLngToH3(lat, lng, H3Resolution.PICKUP_POINT);
    const cells = getKRingCells(centerCell, k);

    // Multi-get all driver IDs from cells
    const pipeline = this.redis.pipeline();
    for (const cell of cells) {
      const cellKey = REDIS_KEY_PATTERNS.DRIVERS_IN_CELL(H3Resolution.PICKUP_POINT, cell);
      pipeline.smembers(cellKey);
    }

    const results = await pipeline.exec();
    const driverIds = new Set<string>();

    if (results) {
      for (const [err, members] of results) {
        if (!err && Array.isArray(members)) {
          members.forEach((id) => driverIds.add(id as string));
        }
      }
    }

    if (driverIds.size === 0) {
      return [];
    }

    // Fetch and filter drivers by state
    const drivers = await this.getDriverMetadataBatch(Array.from(driverIds));
    return drivers.filter(
      (d) => d.state === DriverState.IDLE || d.state === DriverState.OPEN_FOR_DISPATCH,
    );
  }

  /**
   * Austin: Get driver metadata from Redis
   */
  async getDriverMetadata(driverId: string): Promise<H3IndexedDriver | null> {
    const metaKey = REDIS_KEY_PATTERNS.DRIVER_METADATA(driverId);
    const data = await this.redis.hgetall(metaKey);

    if (!data || !data.driverId) {
      return null;
    }

    return this.parseDriverMetadata(data);
  }

  /**
   * Austin: Batch fetch driver metadata
   */
  async getDriverMetadataBatch(driverIds: string[]): Promise<H3IndexedDriver[]> {
    const pipeline = this.redis.pipeline();
    
    for (const driverId of driverIds) {
      const metaKey = REDIS_KEY_PATTERNS.DRIVER_METADATA(driverId);
      pipeline.hgetall(metaKey);
    }

    const results = await pipeline.exec();
    const drivers: H3IndexedDriver[] = [];

    if (results) {
      for (const [err, data] of results) {
        if (!err && data && typeof data === 'object' && (data as Record<string, string>).driverId) {
          drivers.push(this.parseDriverMetadata(data as Record<string, string>));
        }
      }
    }

    return drivers;
  }

  /**
   * Austin: Get driver state
   */
  async getDriverState(driverId: string): Promise<DriverState | null> {
    const stateKey = REDIS_KEY_PATTERNS.DRIVER_STATE(driverId);
    const state = await this.redis.get(stateKey);
    return state as DriverState | null;
  }

  /**
   * Austin: Update driver state
   */
  async updateDriverState(driverId: string, newState: DriverState): Promise<void> {
    const pipeline = this.redis.pipeline();

    const stateKey = REDIS_KEY_PATTERNS.DRIVER_STATE(driverId);
    pipeline.set(stateKey, newState, 'EX', this.DRIVER_TTL_SECONDS);

    // Also update in metadata
    const metaKey = REDIS_KEY_PATTERNS.DRIVER_METADATA(driverId);
    pipeline.hset(metaKey, 'state', newState);

    await pipeline.exec();
  }

  private parseDriverMetadata(data: Record<string, string>): H3IndexedDriver {
    return {
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      currentLocation: {
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lng),
        h3Res10: data.h3Res10,
      },
      state: data.state as DriverState,
      lastUpdateTime: new Date(parseInt(data.lastUpdate, 10)),
      heading: data.heading ? parseFloat(data.heading) : undefined,
      speed: data.speed ? parseFloat(data.speed) : undefined,
      rating: parseFloat(data.rating) || 4.5,
      currentTripId: data.currentTripId || undefined,
    };
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  /**
   * Austin: Get count of drivers in a cell (for load balancing)
   */
  async getDriverCountInCell(h3Index: string): Promise<number> {
    const cellKey = REDIS_KEY_PATTERNS.DRIVERS_IN_CELL(H3Resolution.PICKUP_POINT, h3Index);
    return this.redis.scard(cellKey);
  }

  /**
   * Austin: Get count of stops in a cell
   */
  async getStopCountInCell(h3Index: string): Promise<number> {
    const cellKey = REDIS_KEY_PATTERNS.STOPS_IN_CELL(H3Resolution.PICKUP_POINT, h3Index);
    return this.redis.scard(cellKey);
  }

  /**
   * Austin: Health check for Redis connection
   */
  async healthCheck(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        connected: true,
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        connected: false,
        latencyMs: -1,
      };
    }
  }

  /**
   * Austin: Clear all H3 spatial index data (for testing)
   */
  async clearAllData(): Promise<void> {
    const keys = await this.redis.keys('h3:*');
    const driverKeys = await this.redis.keys('driver:*');
    const stopKeys = await this.redis.keys('stop:*');

    const allKeys = [...keys, ...driverKeys, ...stopKeys];
    if (allKeys.length > 0) {
      await this.redis.del(...allKeys);
    }

    this.logger.warn(`Cleared ${allKeys.length} keys from Redis`);
  }
}
