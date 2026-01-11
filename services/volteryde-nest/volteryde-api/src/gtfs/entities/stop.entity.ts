// ============================================================================
// Stop Entity
// ============================================================================
// GTFS-compliant entity for transit stops/stations
// Reference: https://gtfs.org/schedule/reference/#stopstxt
// Extended with PostGIS geometry for spatial queries

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
