// ============================================================================
// Mapbox Module
// ============================================================================
// NestJS module providing Mapbox-native spatial services
// Replaces H3-based spatial indexing with pure Mapbox API services

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MapboxLocatorService } from './mapbox-locator.service';
import { MapboxMatchmakerService } from './mapbox-matchmaker.service';
import { MapboxNavigatorService } from './mapbox-navigator.service';
import { MapboxTilesetSyncService } from './mapbox-tileset-sync.service';

/**
 * Mapbox Module
 * 
 * Provides the following services:
 * 
 * - MapboxLocatorService: Snaps user GPS to nearest bus stop via Tilequery API
 * - MapboxMatchmakerService: Finds optimal stop pairs via Matrix API
 * - MapboxNavigatorService: Generates driver routes via Directions API
 * - MapboxTilesetSyncService: Syncs stop data to Mapbox Tileset
 * 
 * Required environment variables:
 * - MAPBOX_ACCESS_TOKEN: Mapbox API access token
 * - MAPBOX_STOPS_TILESET_ID: Tileset ID for bus stops (default: 'volteryde.stops')
 * - MAPBOX_STOPS_DATASET_ID: Dataset ID for editing (default: 'stops')
 * - MAPBOX_DEFAULT_SNAP_RADIUS: Default snap radius in meters (default: 500)
 * - MAPBOX_MAX_SNAP_RADIUS: Maximum snap radius in meters (default: 1500)
 * - MAPBOX_TILEQUERY_CACHE_TTL: Cache TTL for tilequery in seconds (default: 60)
 * - MAPBOX_MATRIX_CACHE_TTL: Cache TTL for matrix in seconds (default: 300)
 */
@Module({
	imports: [ConfigModule],
	providers: [
		MapboxLocatorService,
		MapboxMatchmakerService,
		MapboxNavigatorService,
		MapboxTilesetSyncService,
	],
	exports: [
		MapboxLocatorService,
		MapboxMatchmakerService,
		MapboxNavigatorService,
		MapboxTilesetSyncService,
	],
})
export class MapboxModule { }
