// ============================================================================
// StopTime Entity
// ============================================================================
// GTFS-compliant entity for arrival/departure times at stops
// Reference: https://gtfs.org/schedule/reference/#stop_timestxt

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
	Unique,
} from 'typeorm';
import { Trip } from './trip.entity';
import { Stop } from './stop.entity';

export enum PickupType {
	REGULAR = 0,          // Regularly scheduled pickup
	NO_PICKUP = 1,        // No pickup available
	PHONE_AGENCY = 2,     // Must phone agency
	COORDINATE_DRIVER = 3, // Must coordinate with driver
}

export enum DropOffType {
	REGULAR = 0,          // Regularly scheduled drop-off
	NO_DROP_OFF = 1,      // No drop-off available
	PHONE_AGENCY = 2,     // Must phone agency
	COORDINATE_DRIVER = 3, // Must coordinate with driver
}

export enum Timepoint {
	APPROXIMATE = 0, // Times are approximate
	EXACT = 1,       // Times are exact
}

@Entity('gtfs_stop_times')
@Index(['tripId', 'stopSequence'])
@Index(['stopId', 'arrivalTime'])
@Unique(['tripId', 'stopSequence'])
export class StopTime {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'tripId' })
	tripId: string; // trip_id (FK)

	@ManyToOne(() => Trip, (trip) => trip.stopTimes)
	@JoinColumn({ name: 'tripId', referencedColumnName: 'tripId' })
	trip: Trip;

	@Column({ name: 'stopId' })
	stopId: string; // stop_id (FK)

	@ManyToOne(() => Stop)
	@JoinColumn({ name: 'stopId', referencedColumnName: 'stopId' })
	stop: Stop;

	@Column({ name: 'arrivalTime' })
	arrivalTime: string; // arrival_time (HH:MM:SS, can exceed 24:00)

	@Column({ name: 'departureTime' })
	departureTime: string; // departure_time (HH:MM:SS)

	@Column({ name: 'stopSequence', type: 'int' })
	stopSequence: number; // stop_sequence (order of stop in trip)

	@Column({ name: 'stopHeadsign', nullable: true })
	stopHeadsign: string; // stop_headsign (override for this stop)

	@Column({
		name: 'pickupType',
		type: 'int',
		default: 0, // PickupType.REGULAR
	})
	pickupType: number;

	@Column({
		name: 'dropOffType',
		type: 'int',
		default: 0, // DropOffType.REGULAR
	})
	dropOffType: number;

	@Column({
		name: 'timepoint',
		type: 'int',
		default: 1, // Timepoint.EXACT
	})
	timepoint: number;

	@Column({ name: 'shapeDistTraveled', type: 'decimal', precision: 10, scale: 2, nullable: true })
	shapeDistTraveled: number; // shape_dist_traveled (distance from start)

	// ============================================================================
	// VolteRyde Extensions
	// ============================================================================

	@Column({ name: 'estimatedDwellSeconds', type: 'int', nullable: true })
	estimatedDwellSeconds: number; // Expected time at this stop

	@Column({ name: 'distanceFromPreviousKm', type: 'decimal', precision: 10, scale: 2, nullable: true })
	distanceFromPreviousKm: number; // Distance from previous stop

	@Column({ name: 'expectedBatteryAtStop', type: 'decimal', precision: 5, scale: 2, nullable: true })
	expectedBatteryAtStop: number; // Predicted battery % at this stop

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;
}
