// ============================================================================
// Trip Entity
// ============================================================================
// GTFS-compliant entity for transit trips
// Reference: https://gtfs.org/schedule/reference/#tripstxt
// Extended with EV-specific fields for battery/range management

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	JoinColumn,
	Index,
} from 'typeorm';
import { Route } from './route.entity';
import { StopTime } from './stop-time.entity';
import { Calendar } from './calendar.entity';

export enum DirectionId {
	OUTBOUND = 0, // Travel in one direction
	INBOUND = 1,  // Travel in opposite direction
}

export enum WheelchairAccessible {
	NO_INFO = 0,
	ACCESSIBLE = 1,
	NOT_ACCESSIBLE = 2,
}

export enum BikesAllowed {
	NO_INFO = 0,
	ALLOWED = 1,
	NOT_ALLOWED = 2,
}

@Entity('gtfs_trips')
@Index(['routeId', 'serviceId'])
@Index(['blockId'])
export class Trip {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'tripId', unique: true })
	tripId: string; // GTFS trip_id

	@Column({ name: 'routeId' })
	routeId: string; // route_id (FK)

	@ManyToOne(() => Route, (route) => route.trips)
	@JoinColumn({ name: 'routeId', referencedColumnName: 'routeId' })
	route: Route;

	@Column({ name: 'serviceId' })
	serviceId: string; // service_id (FK to calendar)

	@ManyToOne(() => Calendar, (calendar) => calendar.trips)
	@JoinColumn({ name: 'serviceId', referencedColumnName: 'serviceId' })
	calendar: Calendar;

	@Column({ name: 'tripHeadsign', nullable: true })
	tripHeadsign: string; // trip_headsign (destination sign)

	@Column({ name: 'tripShortName', nullable: true })
	tripShortName: string; // trip_short_name

	@Column({
		name: 'directionId',
		type: 'int',
		nullable: true,
	})
	directionId: number; // direction_id

	@Column({ name: 'blockId', nullable: true })
	blockId: string; // block_id - CRITICAL for EV range modeling

	@Column({ name: 'shapeId', nullable: true })
	shapeId: string; // shape_id (reference to shapes table)

	@Column({
		name: 'wheelchairAccessible',
		type: 'int',
		default: 0, // WheelchairAccessible.NO_INFO
	})
	wheelchairAccessible: number;

	@Column({
		name: 'bikesAllowed',
		type: 'int',
		default: 0, // BikesAllowed.NO_INFO
	})
	bikesAllowed: number;

	// ============================================================================
	// VolteRyde Extensions (EV Fleet Management)
	// ============================================================================

	@Column({ name: 'vehicleId', nullable: true })
	vehicleId: string; // Assigned vehicle for this trip

	@Column({ name: 'driverId', nullable: true })
	driverId: string; // Assigned driver for this trip

	@Column({ type: 'int', default: 0 })
	capacity: number; // Seat capacity for this trip

	@Column({ name: 'availableSeats', type: 'int', default: 0 })
	availableSeats: number; // Current available seats

	@Column({ name: 'tripDistanceKm', type: 'decimal', precision: 10, scale: 2, nullable: true })
	tripDistanceKm: number; // Distance of this specific trip

	@Column({ name: 'requiredBatteryPercent', type: 'decimal', precision: 5, scale: 2, nullable: true })
	requiredBatteryPercent: number; // Minimum battery needed to complete trip

	@Column({ name: 'estimatedEnergyConsumptionKwh', type: 'decimal', precision: 10, scale: 2, nullable: true })
	estimatedEnergyConsumptionKwh: number; // Estimated energy for trip

	@Column({ name: 'isActive', default: true })
	isActive: boolean; // Whether trip is currently scheduled

	@Column({ name: 'actualDepartureTime', type: 'timestamp', nullable: true })
	actualDepartureTime: Date; // Real departure (for delays)

	@Column({ name: 'delaySeconds', type: 'int', default: 0 })
	delaySeconds: number; // Current delay in seconds

	@OneToMany(() => StopTime, (stopTime) => stopTime.trip)
	stopTimes: StopTime[];

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updatedAt' })
	updatedAt: Date;
}
