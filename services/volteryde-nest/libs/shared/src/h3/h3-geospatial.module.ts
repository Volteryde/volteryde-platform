// ============================================================================
// H3 Geospatial Module
// ============================================================================
// Austin: NestJS module for H3-based geospatial services
// Provides dependency injection for all H3 services across the application
// Import this module in any feature module that needs geospatial capabilities

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { H3Service } from './h3.service';
import { RedisH3SpatialService } from './redis-h3-spatial.service';
import { DriverStateMachineService } from './driver-state-machine.service';
import { BatchedMatchingService } from './batched-matching.service';
import { RoutingStitchingService } from './routing-stitching.service';
import { SupplyService } from './supply.gateway';
import { GeoIngestService } from './geo-ingest.service';
import { DistancePricingService } from './distance-pricing.service';
import { StopToStopRoutingService } from './stop-to-stop-routing.service';

/**
 * Austin: Global H3 Geospatial Module
 * 
 * This module provides the complete geospatial infrastructure for VolteRyde:
 * 
 * - H3Service: Core H3 indexing, k-ring queries, smart snap algorithm
 * - RedisH3SpatialService: O(1) spatial lookups for stops and drivers
 * - DriverStateMachineService: FSM for driver lifecycle
 * - BatchedMatchingService: Hungarian algorithm for optimal matching
 * - StopToStopRoutingService: Stop-to-stop routing and fare estimation
 * - SupplyService: WebSocket gateway for real-time driver tracking
 * - GeoIngestService: OSM to H3 pipeline for stop data
 * - DistancePricingService: Distance-based fare calculation with zone pricing
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    H3Service,
    RedisH3SpatialService,
    DriverStateMachineService,
    BatchedMatchingService,
    RoutingStitchingService,
    StopToStopRoutingService,
    SupplyService,
    GeoIngestService,
    DistancePricingService,
  ],
  exports: [
    H3Service,
    RedisH3SpatialService,
    DriverStateMachineService,
    BatchedMatchingService,
    RoutingStitchingService,
    StopToStopRoutingService,
    SupplyService,
    GeoIngestService,
    DistancePricingService,
  ],
})
export class H3GeospatialModule {}
