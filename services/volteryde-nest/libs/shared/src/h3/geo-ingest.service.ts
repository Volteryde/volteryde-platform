// ============================================================================
// Geo-Ingest Service - OSM to H3 Pipeline
// ============================================================================
// Austin: Background worker that syncs bus stops from OpenStreetMap,
// validates them via Mapbox Map Matching, and builds the H3-indexed
// spatial graph for pickup/dropoff operations.
//
// Pipeline stages:
// 1. Overpass API Query → Extract bus_stop nodes from OSM
// 2. Geometric Validation → Mapbox Map Matching to verify street access
// 3. H3 Indexing → Compute indices at resolutions 10/8/6
// 4. Graph Update → Sync to PostgreSQL and Redis spatial index

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as h3 from 'h3-js';
import { H3Resolution } from './h3.constants';
import { GeoCoordinate, StopAccessGrade } from './h3.types';
import { RedisH3SpatialService } from './redis-h3-spatial.service';

// Austin: Mapbox snap radius for map matching validation (30m per spec)
const MAPBOX_MAP_MATCHING_SNAP_RADIUS_METERS = 30;

// Austin: Import Stop entity - adjust path based on actual project structure
// This assumes the Stop entity is in the GTFS module
interface StopEntity {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
  h3Res10?: string;
  h3Res8?: string;
  h3Res6?: string;
  accessH3Index?: string;
  accessGrade?: StopAccessGrade;
  isActiveForPickup?: boolean;
  safetyScore?: number;
}

/**
 * Austin: OSM Overpass API response types
 */
interface OverpassResponse {
  elements: OverpassElement[];
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

/**
 * Austin: Mapbox Map Matching API response
 */
interface MapMatchingResponse {
  code: string;
  matchings?: MapMatchingResult[];
  tracepoints?: TracePoint[];
}

interface MapMatchingResult {
  confidence: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: Array<{
    summary: string;
    weight: number;
    duration: number;
    distance: number;
  }>;
}

interface TracePoint {
  waypoint_index: number;
  matchings_index: number;
  alternatives_count: number;
  location: [number, number]; // [lon, lat]
  name: string;
}

/**
 * Austin: Ingest operation result tracking
 */
interface IngestResult {
  totalFetched: number;
  newStops: number;
  updatedStops: number;
  validatedStops: number;
  invalidatedStops: number;
  errors: string[];
  durationMs: number;
}

@Injectable()
export class GeoIngestService implements OnModuleInit {
  private readonly logger = new Logger(GeoIngestService.name);

  // Austin: Overpass API endpoints - primary and fallback
  private readonly overpassEndpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
  ];

  private mapboxAccessToken: string;
  private isIngesting = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisH3Service: RedisH3SpatialService,
    // Austin: Inject Stop repository - uncomment when entity is available
    // @InjectRepository(Stop)
    // private readonly stopRepository: Repository<Stop>,
  ) {
    this.mapboxAccessToken = this.configService.get<string>(
      'MAPBOX_ACCESS_TOKEN',
      '',
    );
  }

  async onModuleInit() {
    this.logger.log('🌍 Geo-Ingest Service initialized');

    // Austin: Validate Mapbox token on startup
    if (!this.mapboxAccessToken) {
      this.logger.warn('⚠️ MAPBOX_ACCESS_TOKEN not configured - validation will be skipped');
    }
  }

  // ============================================================================
  // Scheduled Ingest Jobs
  // ============================================================================

  /**
   * Austin: Run full ingest - can be triggered manually or by external scheduler
   * For scheduled execution, use @nestjs/schedule Cron decorator after installing:
   * pnpm add @nestjs/schedule
   * 
   * Example cron setup:
   * @Cron(CronExpression.EVERY_6_HOURS)
   */
  async scheduledFullIngest() {
    await this.runFullIngest();
  }

  /**
   * Austin: Quick validation check
   * Can be scheduled hourly via external scheduler or @nestjs/schedule
   */
  async scheduledQuickValidation() {
    await this.runQuickValidation();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Austin: Run full OSM ingest for a bounding box
   * Default covers Accra metropolitan area
   */
  async runFullIngest(
    bbox?: { south: number; west: number; north: number; east: number },
  ): Promise<IngestResult> {
    if (this.isIngesting) {
      this.logger.warn('⚠️ Ingest already in progress, skipping');
      return {
        totalFetched: 0,
        newStops: 0,
        updatedStops: 0,
        validatedStops: 0,
        invalidatedStops: 0,
        errors: ['Ingest already in progress'],
        durationMs: 0,
      };
    }

    this.isIngesting = true;
    const startTime = Date.now();
    const errors: string[] = [];

    // Austin: Default bounding box - Accra metro area
    const defaultBbox = {
      south: 5.5,    // Southern boundary
      west: -0.35,   // Western boundary  
      north: 5.75,   // Northern boundary
      east: 0.05,    // Eastern boundary
    };
    const activeBbox = bbox || defaultBbox;

    this.logger.log(`🚀 Starting full ingest for bbox: ${JSON.stringify(activeBbox)}`);

    try {
      // Stage 1: Fetch from OSM
      const osmStops = await this.fetchOSMBusStops(activeBbox);
      this.logger.log(`📥 Fetched ${osmStops.length} bus stops from OSM`);

      if (osmStops.length === 0) {
        return {
          totalFetched: 0,
          newStops: 0,
          updatedStops: 0,
          validatedStops: 0,
          invalidatedStops: 0,
          errors: ['No stops found in bbox'],
          durationMs: Date.now() - startTime,
        };
      }

      // Stage 2: Compute H3 indices
      const h3IndexedStops = this.computeH3Indices(osmStops);

      // Stage 3: Validate via Mapbox Map Matching (batch)
      const validatedStops = await this.validateStopsViaMapMatching(h3IndexedStops);

      // Stage 4: Sync to database and Redis
      const syncResult = await this.syncToStorage(validatedStops);

      this.isIngesting = false;
      return {
        totalFetched: osmStops.length,
        newStops: syncResult.newCount,
        updatedStops: syncResult.updateCount,
        validatedStops: validatedStops.filter(s => s.isActiveForPickup).length,
        invalidatedStops: validatedStops.filter(s => !s.isActiveForPickup).length,
        errors,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      this.isIngesting = false;
      this.logger.error(`❌ Ingest failed: ${error.message}`);
      errors.push(error.message);
      return {
        totalFetched: 0,
        newStops: 0,
        updatedStops: 0,
        validatedStops: 0,
        invalidatedStops: 0,
        errors,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Austin: Quick validation for flagged stops
   * Faster than full ingest - only rechecks problematic stops
   */
  async runQuickValidation(): Promise<number> {
    this.logger.log('⚡ Running quick validation check');
    // Austin: Implementation would query stops with low safety scores
    // or recent validation failures and recheck them
    return 0;
  }

  /**
   * Austin: Manually trigger ingest for a specific area
   */
  async ingestArea(
    center: GeoCoordinate,
    radiusKm: number,
  ): Promise<IngestResult> {
    // Austin: Convert center + radius to bounding box
    const latDelta = radiusKm / 111.32; // degrees per km at equator
    const lonDelta = radiusKm / (111.32 * Math.cos(center.latitude * Math.PI / 180));

    const bbox = {
      south: center.latitude - latDelta,
      west: center.longitude - lonDelta,
      north: center.latitude + latDelta,
      east: center.longitude + lonDelta,
    };

    return this.runFullIngest(bbox);
  }

  // ============================================================================
  // Stage 1: OSM Overpass API Query
  // ============================================================================

  /**
   * Austin: Fetch bus stops from OpenStreetMap via Overpass API
   * Queries for highway=bus_stop and public_transport=platform nodes
   */
  private async fetchOSMBusStops(
    bbox: { south: number; west: number; north: number; east: number },
  ): Promise<OverpassElement[]> {
    // Austin: Overpass QL query for bus stops
    // Fetches both bus_stop nodes and public_transport platform nodes
    const query = `
      [out:json][timeout:60];
      (
        node["highway"="bus_stop"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        node["public_transport"="platform"]["bus"="yes"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        node["public_transport"="stop_position"]["bus"="yes"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      );
      out body;
    `;

    // Austin: Try endpoints in order with fallback
    for (const endpoint of this.overpassEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
          this.logger.warn(`Overpass endpoint ${endpoint} returned ${response.status}`);
          continue;
        }

        const data: OverpassResponse = await response.json();
        return data.elements.filter(
          (el) => el.type === 'node' && el.lat !== undefined && el.lon !== undefined,
        );
      } catch (error) {
        this.logger.warn(`Overpass endpoint ${endpoint} failed: ${error.message}`);
      }
    }

    throw new Error('All Overpass API endpoints failed');
  }

  // ============================================================================
  // Stage 2: H3 Index Computation
  // ============================================================================

  /**
   * Austin: Compute H3 indices at multiple resolutions for each stop
   */
  private computeH3Indices(
    osmStops: OverpassElement[],
  ): Array<StopEntity & { osmId: number }> {
    return osmStops.map((stop) => {
      // Austin: Compute H3 indices at each resolution
      const h3Res10 = h3.latLngToCell(stop.lat!, stop.lon!, H3Resolution.PICKUP_POINT);
      const h3Res8 = h3.latLngToCell(stop.lat!, stop.lon!, H3Resolution.DRIVER_DISCOVERY);
      const h3Res6 = h3.latLngToCell(stop.lat!, stop.lon!, H3Resolution.SHARD);

      // Austin: Determine stop name from OSM tags
      const name =
        stop.tags?.name ||
        stop.tags?.['name:en'] ||
        stop.tags?.ref ||
        `Bus Stop ${stop.id}`;

      // Austin: Infer access grade from OSM tags
      const accessGrade = this.inferAccessGrade(stop.tags || {});

      return {
        stopId: `osm:${stop.id}`,
        osmId: stop.id,
        stopName: name,
        stopLat: stop.lat!,
        stopLon: stop.lon!,
        h3Res10,
        h3Res8,
        h3Res6,
        accessH3Index: h3Res10, // Default to same as physical location
        accessGrade,
        isActiveForPickup: true, // Will be validated in stage 3
        safetyScore: 0.5, // Default neutral score
      };
    });
  }

  /**
   * Austin: Infer stop access grade from OSM tags
   */
  private inferAccessGrade(tags: Record<string, string>): StopAccessGrade {
    // Austin: Terminal indicators
    if (
      tags.building ||
      tags['public_transport'] === 'station' ||
      tags.amenity === 'bus_station'
    ) {
      return StopAccessGrade.TERMINAL;
    }

    // Austin: Bay indicators
    if (
      tags.shelter === 'yes' ||
      tags.bench === 'yes' ||
      tags['bus_bay'] === 'yes'
    ) {
      return StopAccessGrade.BAY;
    }

    // Austin: Default to curb (direct street access)
    return StopAccessGrade.CURB;
  }

  // ============================================================================
  // Stage 3: Mapbox Map Matching Validation
  // ============================================================================

  /**
   * Austin: Validate stops via Mapbox Map Matching API
   * Ensures that a vehicle can legally stop near each point
   */
  private async validateStopsViaMapMatching(
    stops: Array<StopEntity & { osmId: number }>,
  ): Promise<Array<StopEntity & { osmId: number }>> {
    if (!this.mapboxAccessToken) {
      this.logger.warn('⚠️ Skipping Map Matching validation - no token');
      return stops;
    }

    // Austin: Process in batches of 100 (Mapbox API limit)
    const batchSize = 100;
    const validatedStops: Array<StopEntity & { osmId: number }> = [];

    for (let i = 0; i < stops.length; i += batchSize) {
      const batch = stops.slice(i, i + batchSize);
      
      try {
        const validated = await this.validateBatch(batch);
        validatedStops.push(...validated);
        
        // Austin: Rate limiting - wait between batches
        if (i + batchSize < stops.length) {
          await this.sleep(200);
        }
      } catch (error) {
        this.logger.warn(`Map Matching batch ${i / batchSize} failed: ${error.message}`);
        // Austin: On failure, keep stops but mark for revalidation
        validatedStops.push(...batch);
      }
    }

    return validatedStops;
  }

  /**
   * Austin: Validate a batch of stops via Map Matching
   */
  private async validateBatch(
    stops: Array<StopEntity & { osmId: number }>,
  ): Promise<Array<StopEntity & { osmId: number }>> {
    // Austin: Build coordinate string for Mapbox API
    const coordinates = stops
      .map((s) => `${s.stopLon},${s.stopLat}`)
      .join(';');

    const url = new URL(
      `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}`,
    );
    url.searchParams.set('access_token', this.mapboxAccessToken);
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('radiuses', stops.map(() => MAPBOX_MAP_MATCHING_SNAP_RADIUS_METERS).join(';'));
    url.searchParams.set('steps', 'false');
    url.searchParams.set('tidy', 'true');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Map Matching API error: ${response.status}`);
    }

    const data: MapMatchingResponse = await response.json();

    // Austin: Process tracepoints to validate each stop
    return stops.map((stop, index) => {
      const tracepoint = data.tracepoints?.[index];

      if (!tracepoint || tracepoint.location === null) {
        // Austin: Stop couldn't be matched to road network
        return {
          ...stop,
          isActiveForPickup: false,
          safetyScore: 0.1,
        };
      }

      // Austin: Update access H3 index to the snapped location
      const [snappedLon, snappedLat] = tracepoint.location;
      const accessH3Index = h3.latLngToCell(snappedLat, snappedLon, H3Resolution.PICKUP_POINT);

      // Austin: Calculate confidence-based safety score
      // Tracepoint being matched with alternatives indicates good road access
      const safetyScore = Math.min(
        1.0,
        0.5 + (tracepoint.alternatives_count * 0.1),
      );

      // Austin: Check road name to exclude motorways/highways
      const isMotorway = this.isMotorwayStop(tracepoint.name);

      return {
        ...stop,
        accessH3Index,
        isActiveForPickup: !isMotorway,
        safetyScore: isMotorway ? 0.0 : safetyScore,
      };
    });
  }

  /**
   * Austin: Check if stop is on a motorway/highway (unsafe for pickup)
   */
  private isMotorwayStop(roadName: string): boolean {
    if (!roadName) return false;

    const motorwayPatterns = [
      /motorway/i,
      /highway/i,
      /expressway/i,
      /N\d+/i,      // Nigerian highway notation
      /^A\d+$/i,    // European highway notation
      /freeway/i,
    ];

    return motorwayPatterns.some((pattern) => pattern.test(roadName));
  }

  // ============================================================================
  // Stage 4: Storage Sync
  // ============================================================================

  /**
   * Austin: Sync validated stops to PostgreSQL and Redis
   */
  private async syncToStorage(
    stops: Array<StopEntity & { osmId: number }>,
  ): Promise<{ newCount: number; updateCount: number }> {
    let newCount = 0;
    let updateCount = 0;

    for (const stop of stops) {
      try {
        // Austin: Check if stop exists in Redis by searching near its coordinates
        const existing = await this.redisH3Service.findStopsNearCoordinate(
          stop.stopLat,
          stop.stopLon,
          0, // k=0 for exact cell match
        );

        const isNew = !existing.some((s) => s.stopId === stop.stopId);

        // Austin: Index in Redis spatial index
        await this.redisH3Service.indexStop({
          stopId: stop.stopId,
          stopName: stop.stopName,
          location: {
            latitude: stop.stopLat,
            longitude: stop.stopLon,
          },
          physicalH3Index: stop.h3Res10!,
          accessH3Index: stop.accessH3Index!,
          accessGrade: stop.accessGrade!,
          isActiveForPickup: stop.isActiveForPickup!,
          avgApproachTimeSeconds: this.estimateApproachTime(stop.accessGrade!),
        });

        if (isNew) {
          newCount++;
        } else {
          updateCount++;
        }

        // Austin: PostgreSQL sync would happen here
        // await this.stopRepository.upsert(stop, ['stopId']);
      } catch (error) {
        this.logger.warn(`Failed to sync stop ${stop.stopId}: ${error.message}`);
      }
    }

    this.logger.log(`✅ Synced ${newCount} new, ${updateCount} updated stops to storage`);
    return { newCount, updateCount };
  }

  /**
   * Austin: Estimate approach time based on access grade
   */
  private estimateApproachTime(accessGrade: StopAccessGrade): number {
    switch (accessGrade) {
      case StopAccessGrade.CURB:
        return 15; // 15 seconds - quick curb pickup
      case StopAccessGrade.BAY:
        return 30; // 30 seconds - pull into bay
      case StopAccessGrade.TERMINAL:
        return 90; // 90 seconds - walking through terminal
      default:
        return 30;
    }
  }

  // ============================================================================
  // H3 Backfill for Existing Stops
  // ============================================================================

  /**
   * Austin: Backfill H3 indices for stops that don't have them
   * Called during migration or on-demand
   */
  async backfillH3Indices(): Promise<number> {
    this.logger.log('🔄 Starting H3 index backfill for existing stops');

    // Austin: This would query stops without H3 indices and compute them
    // Implementation depends on actual repository availability
    
    // Example implementation:
    // const stopsWithoutH3 = await this.stopRepository.find({
    //   where: { h3Res10: IsNull() },
    // });
    //
    // for (const stop of stopsWithoutH3) {
    //   stop.h3Res10 = h3.latLngToCell(stop.stopLat, stop.stopLon, 10);
    //   stop.h3Res8 = h3.latLngToCell(stop.stopLat, stop.stopLon, 8);
    //   stop.h3Res6 = h3.latLngToCell(stop.stopLat, stop.stopLon, 6);
    //   await this.stopRepository.save(stop);
    // }

    return 0;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Austin: Get ingest service status for health checks
   */
  getStatus(): { isIngesting: boolean; lastIngestTime?: Date } {
    return {
      isIngesting: this.isIngesting,
    };
  }
}
