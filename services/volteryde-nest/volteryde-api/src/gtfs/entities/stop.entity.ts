// ============================================================================
// Stop Entity
// ============================================================================
// GTFS-compliant entity for transit stops/stations
// Reference: https://gtfs.org/schedule/reference/#stopstxt
// Extended with PostGIS geometry and H3 hexagonal indexing for spatial queries
// Austin: H3 indices enable O(1) proximity searches for VolteRyde dispatch

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	Index,
} from 'typeorm';
import { StopTime } from './stop-time.entity';

export enum LocationType {
	STOP = 0,           // Stop or platform
	STATION = 1,        // Station (contains stops)
	ENTRANCE_EXIT = 2,  // Entrance/exit
	GENERIC_NODE = 3,   // Generic node
	BOARDING_AREA = 4,  // Boarding area
}

export enum WheelchairBoarding {
	NO_INFO = 0,
	POSSIBLE = 1,
	NOT_POSSIBLE = 2,
}

// Austin: Stop access grading for ETA buffer calculations
// Affects dwell time estimates in trip planning
export enum StopAccessGrade {
	CURB = 'CURB',           // Direct curb access - lowest dwell time (~30s)
	BAY = 'BAY',             // Dedicated bay - medium dwell time (~45s)
	TERMINAL = 'TERMINAL',   // Terminal with walking required - highest dwell (~90s)
}

@Entity('gtfs_stops')
@Index(['stopLat', 'stopLon'])
export class Stop {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'stopId', unique: true })
	stopId: string; // GTFS stop_id

	@Column({ name: 'stopCode', nullable: true })
	stopCode: string; // stop_code (short identifier for passengers)

	@Column({ name: 'stopName' })
	stopName: string; // stop_name

	@Column({ name: 'stopDesc', nullable: true, type: 'text' })
	stopDesc: string; // stop_desc

	@Column({ name: 'stopLat', type: 'decimal', precision: 10, scale: 6 })
	stopLat: number; // stop_lat (WGS84)

	@Column({ name: 'stopLon', type: 'decimal', precision: 10, scale: 6 })
	stopLon: number; // stop_lon (WGS84)

	@Column({ name: 'zoneId', nullable: true })
	zoneId: string; // zone_id (for fare calculations)

	@Column({ name: 'stopUrl', nullable: true })
	stopUrl: string; // stop_url

	@Column({
		name: 'locationType',
		type: 'int',
		default: 0, // LocationType.STOP
	})
	locationType: number; // location_type

	@Column({ name: 'parentStation', nullable: true })
	parentStation: string; // parent_station (if within a station)

	@Column({ name: 'stopTimezone', nullable: true })
	stopTimezone: string; // stop_timezone

	@Column({
		name: 'wheelchairBoarding',
		type: 'int',
		default: 0, // WheelchairBoarding.NO_INFO
	})
	wheelchairBoarding: number; // wheelchair_boarding

	@Column({ name: 'levelId', nullable: true })
	levelId: string; // level_id

	@Column({ name: 'platformCode', nullable: true })
	platformCode: string; // platform_code

	// ============================================================================
	// VolteRyde Extensions (EV-specific)
	// ============================================================================

	@Column({ name: 'isChargingStation', default: false })
	isChargingStation: boolean; // Extension: indicates if stop is near charging

	@Column({ name: 'chargingStationId', nullable: true })
	chargingStationId: string; // Reference to charging station if applicable

	@Column({ name: 'averageDwellTimeSeconds', type: 'int', nullable: true })
	averageDwellTimeSeconds: number; // Average time buses stop here

	@Column({ type: 'jsonb', nullable: true })
	amenities: {
		shelter: boolean;
		bench: boolean;
		lighting: boolean;
		realtimeDisplay: boolean;
		ticketMachine: boolean;
	};

	// ============================================================================
	// Austin: H3 Hexagonal Spatial Indices for High-Frequency Dispatch
	// ============================================================================
	// These indices enable O(1) proximity searches by converting geometric
	// operations into set membership checks. See architecture spec Section 2.

	// Austin: Primary H3 index at Resolution 10 (~66m edge length)
	// This is the operating resolution for all pickup point matching
	@Column({ name: 'h3Res10', type: 'bigint', nullable: true })
	@Index('idx_stop_h3_res10')
	h3Res10: string;

	// Austin: H3 index at Resolution 8 (~460m edge length)
	// Used for driver discovery and regional grouping
	@Column({ name: 'h3Res8', type: 'bigint', nullable: true })
	@Index('idx_stop_h3_res8')
	h3Res8: string;

	// Austin: H3 index at Resolution 6 (~3.2km edge length)
	// Used for database sharding and city-district partitioning
	@Column({ name: 'h3Res6', type: 'bigint', nullable: true })
	h3Res6: string;

	// Austin: Access point H3 index (may differ from physical location)
	// For terminals, this is where the car actually stops, not the platform
	@Column({ name: 'accessH3Index', type: 'bigint', nullable: true })
	accessH3Index: string;

	// Austin: Access grade affects dwell time calculations
	@Column({
		name: 'accessGrade',
		type: 'enum',
		enum: StopAccessGrade,
		default: StopAccessGrade.CURB,
	})
	accessGrade: StopAccessGrade;

	// Austin: Whether this stop is valid for VolteRyde pickups
	// Stops on highways, private roads, or unsafe locations are excluded
	@Column({ name: 'isActiveForPickup', default: true })
	isActiveForPickup: boolean;

	// Austin: Safety score (0-100) based on intersection data and crime stats
	// Higher is safer. Used in smart snap cost function
	@Column({ name: 'safetyScore', type: 'int', nullable: true, default: 50 })
	safetyScore: number;

	// PostGIS geometry column for spatial queries
	// Note: Requires PostGIS extension enabled on PostgreSQL
	// This will be set via a trigger or service based on stopLat/stopLon
	@Column({
		type: 'geography',
		spatialFeatureType: 'Point',
		srid: 4326,
		nullable: true,
	})
	geom: string; // PostGIS geography point

	@OneToMany(() => StopTime, (stopTime) => stopTime.stop)
	stopTimes: StopTime[];

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updatedAt' })
	updatedAt: Date;
}
