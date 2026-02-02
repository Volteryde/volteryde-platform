// ============================================================================
// Mapbox Tileset Sync Service
// ============================================================================
// Synchronizes bus stop data between PostgreSQL and Mapbox Tileset
// Manages the Dataset (edit layer) and Tileset (read layer) lifecycle

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeoCoordinate } from './mapbox.types';

/**
 * Stop data for tileset sync
 */
export interface StopData {
	stopId: string;
	stopName: string;
	stopCode?: string;
	location: GeoCoordinate;
	zoneId?: string;
	isActive: boolean;
	isChargingStation?: boolean;
	wheelchairAccessible?: boolean;
	routesServed?: string[];
	amenities?: string[];
	updatedAt: Date;
}

/**
 * GeoJSON Feature for Mapbox Dataset
 */
interface StopFeature {
	type: 'Feature';
	id: string;
	geometry: {
		type: 'Point';
		coordinates: [number, number];
	};
	properties: {
		stop_id: string;
		stop_name: string;
		stop_code?: string;
		zone_id?: string;
		is_active: boolean;
		is_charging_station?: boolean;
		wheelchair_accessible?: boolean;
		routes_served?: string[];
		amenities?: string[];
	};
}

/**
 * Mapbox Tileset Sync Service
 * 
 * Responsibilities:
 * 1. Upload stop data to Mapbox Dataset (edit layer)
 * 2. Trigger Tileset publish after Dataset updates
 * 3. Track sync status and handle failures
 * 4. Provide fallback to DB when tileset is stale
 */
@Injectable()
export class MapboxTilesetSyncService {
	private readonly logger = new Logger(MapboxTilesetSyncService.name);
	private readonly mapboxToken: string;
	private readonly datasetId: string;
	private readonly tilesetId: string;
	private readonly baseUrl = 'https://api.mapbox.com';

	// Track last sync time for staleness detection
	private lastSyncTime: Date | null = null;
	private lastPublishTime: Date | null = null;
	private publishInProgress = false;

	constructor(private readonly configService: ConfigService) {
		this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN', '');
		this.datasetId = this.configService.get<string>('MAPBOX_STOPS_DATASET_ID', 'stops');
		this.tilesetId = this.configService.get<string>(
			'MAPBOX_STOPS_TILESET_ID',
			'volteryde.stops',
		);

		if (!this.mapboxToken) {
			this.logger.warn('MAPBOX_ACCESS_TOKEN not configured - tileset sync will fail');
		}
	}

	// ============================================================================
	// Public API
	// ============================================================================

	/**
	 * Sync a batch of stops to Mapbox Dataset
	 * Call this after bulk stop updates
	 * 
	 * @param stops - Array of stop data to sync
	 * @returns Number of features synced
	 */
	async syncStops(stops: StopData[]): Promise<number> {
		if (stops.length === 0) {
			this.logger.debug('No stops to sync');
			return 0;
		}

		this.logger.log(`Syncing ${stops.length} stops to Mapbox Dataset...`);

		try {
			// Convert stops to GeoJSON features
			const features = stops.map((stop) => this.stopToFeature(stop));

			// Upload to Dataset
			await this.uploadToDataset(features);

			this.lastSyncTime = new Date();
			this.logger.log(`Successfully synced ${stops.length} stops`);

			return stops.length;
		} catch (error) {
			this.logger.error(`Failed to sync stops: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Sync a single stop (for real-time updates)
	 * 
	 * @param stop - Stop data to sync
	 */
	async syncSingleStop(stop: StopData): Promise<void> {
		this.logger.debug(`Syncing single stop: ${stop.stopId}`);

		try {
			const feature = this.stopToFeature(stop);
			await this.upsertFeature(feature);
			this.lastSyncTime = new Date();
		} catch (error) {
			this.logger.error(`Failed to sync stop ${stop.stopId}: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Remove a stop from the Dataset
	 * 
	 * @param stopId - ID of stop to remove
	 */
	async removeStop(stopId: string): Promise<void> {
		this.logger.debug(`Removing stop from Dataset: ${stopId}`);

		try {
			await this.deleteFeature(stopId);
			this.lastSyncTime = new Date();
		} catch (error) {
			this.logger.error(`Failed to remove stop ${stopId}: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Publish the Dataset to Tileset
	 * Call this after batch syncs to make changes visible
	 * 
	 * Note: Publishing can take 30-60 seconds for the tileset to propagate
	 */
	async publishTileset(): Promise<void> {
		if (this.publishInProgress) {
			this.logger.warn('Tileset publish already in progress, skipping');
			return;
		}

		this.logger.log('Publishing tileset...');
		this.publishInProgress = true;

		try {
			const url = `${this.baseUrl}/tilesets/v1/${this.tilesetId}/publish?access_token=${this.mapboxToken}`;

			const response = await fetch(url, { method: 'POST' });

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Tileset publish failed (${response.status}): ${errorText}`);
			}

			this.lastPublishTime = new Date();
			this.logger.log('Tileset publish initiated (propagation takes 30-60s)');
		} catch (error) {
			this.logger.error(`Tileset publish failed: ${error.message}`);
			throw error;
		} finally {
			this.publishInProgress = false;
		}
	}

	/**
	 * Get sync status information
	 */
	getSyncStatus(): {
		lastSyncTime: Date | null;
		lastPublishTime: Date | null;
		publishInProgress: boolean;
		tilesetMayBeStale: boolean;
	} {
		const tilesetMayBeStale =
			this.lastSyncTime !== null &&
			(this.lastPublishTime === null ||
				this.lastSyncTime > this.lastPublishTime);

		return {
			lastSyncTime: this.lastSyncTime,
			lastPublishTime: this.lastPublishTime,
			publishInProgress: this.publishInProgress,
			tilesetMayBeStale,
		};
	}

	/**
	 * Full resync - export all stops and republish
	 * Use for disaster recovery or initial setup
	 * 
	 * @param getAllStops - Function to fetch all stops from database
	 */
	async fullResync(
		getAllStops: () => Promise<StopData[]>,
	): Promise<{ synced: number; published: boolean }> {
		this.logger.log('Starting full tileset resync...');

		try {
			// Get all stops from database
			const stops = await getAllStops();
			this.logger.log(`Fetched ${stops.length} stops from database`);

			// Clear existing dataset
			await this.clearDataset();

			// Upload all stops
			const synced = await this.syncStops(stops);

			// Publish tileset
			await this.publishTileset();

			this.logger.log('Full resync completed successfully');
			return { synced, published: true };
		} catch (error) {
			this.logger.error(`Full resync failed: ${error.message}`);
			throw error;
		}
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	/**
	 * Convert StopData to GeoJSON Feature
	 */
	private stopToFeature(stop: StopData): StopFeature {
		return {
			type: 'Feature',
			id: stop.stopId,
			geometry: {
				type: 'Point',
				coordinates: [stop.location.longitude, stop.location.latitude],
			},
			properties: {
				stop_id: stop.stopId,
				stop_name: stop.stopName,
				stop_code: stop.stopCode,
				zone_id: stop.zoneId,
				is_active: stop.isActive,
				is_charging_station: stop.isChargingStation,
				wheelchair_accessible: stop.wheelchairAccessible,
				routes_served: stop.routesServed,
				amenities: stop.amenities,
			},
		};
	}

	/**
	 * Upload features to Mapbox Dataset (batch)
	 */
	private async uploadToDataset(features: StopFeature[]): Promise<void> {
		// Dataset API accepts FeatureCollection
		const geojson = {
			type: 'FeatureCollection',
			features,
		};

		const url = `${this.baseUrl}/datasets/v1/${this.getUsername()}/${this.datasetId}/features?access_token=${this.mapboxToken}`;

		const response = await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(geojson),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Dataset upload failed (${response.status}): ${errorText}`);
		}
	}

	/**
	 * Upsert a single feature to Dataset
	 */
	private async upsertFeature(feature: StopFeature): Promise<void> {
		const url = `${this.baseUrl}/datasets/v1/${this.getUsername()}/${this.datasetId}/features/${feature.id}?access_token=${this.mapboxToken}`;

		const response = await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(feature),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Feature upsert failed (${response.status}): ${errorText}`);
		}
	}

	/**
	 * Delete a feature from Dataset
	 */
	private async deleteFeature(featureId: string): Promise<void> {
		const url = `${this.baseUrl}/datasets/v1/${this.getUsername()}/${this.datasetId}/features/${featureId}?access_token=${this.mapboxToken}`;

		const response = await fetch(url, { method: 'DELETE' });

		if (!response.ok && response.status !== 404) {
			const errorText = await response.text();
			throw new Error(`Feature delete failed (${response.status}): ${errorText}`);
		}
	}

	/**
	 * Clear all features from Dataset
	 */
	private async clearDataset(): Promise<void> {
		this.logger.warn('Clearing Dataset - this will remove all features');

		// List all features
		const listUrl = `${this.baseUrl}/datasets/v1/${this.getUsername()}/${this.datasetId}/features?access_token=${this.mapboxToken}`;
		const listResponse = await fetch(listUrl);

		if (!listResponse.ok) {
			throw new Error(`Failed to list features: ${listResponse.status}`);
		}

		const data = await listResponse.json();
		const featureIds = data.features?.map((f: StopFeature) => f.id) || [];

		// Delete each feature
		for (const id of featureIds) {
			await this.deleteFeature(id);
		}

		this.logger.log(`Cleared ${featureIds.length} features from Dataset`);
	}

	/**
	 * Extract username from tileset ID
	 * Tileset ID format: "username.tileset_name"
	 */
	private getUsername(): string {
		const parts = this.tilesetId.split('.');
		return parts[0] || 'volteryde';
	}
}
