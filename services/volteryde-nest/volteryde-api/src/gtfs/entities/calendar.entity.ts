// ============================================================================
// Calendar Entity
// ============================================================================
// GTFS-compliant entity for service schedules
// Reference: https://gtfs.org/schedule/reference/#calendartxt

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
} from 'typeorm';
import { Trip } from './trip.entity';
import { CalendarDate } from './calendar-date.entity';

@Entity('gtfs_calendar')
export class Calendar {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'serviceId', unique: true })
	serviceId: string; // GTFS service_id

	@Column({ name: 'monday', type: 'boolean' })
	monday: boolean; // 1 = service runs, 0 = no service

	@Column({ type: 'boolean' })
	tuesday: boolean;

	@Column({ type: 'boolean' })
	wednesday: boolean;

	@Column({ type: 'boolean' })
	thursday: boolean;

	@Column({ type: 'boolean' })
	friday: boolean;

	@Column({ type: 'boolean' })
	saturday: boolean;

	@Column({ type: 'boolean' })
	sunday: boolean;

	@Column({ name: 'startDate', type: 'date' })
	startDate: Date; // start_date (YYYYMMDD)

	@Column({ name: 'endDate', type: 'date' })
	endDate: Date; // end_date (YYYYMMDD)

	// ============================================================================
	// VolteRyde Extensions
	// ============================================================================

	@Column({ name: 'serviceName', nullable: true })
	serviceName: string; // Human-readable name (e.g., "Weekday Service")

	@Column({ name: 'description', nullable: true, type: 'text' })
	description: string; // Description of this service pattern

	@Column({ name: 'isActive', default: true })
	isActive: boolean; // Whether this calendar is currently active

	@OneToMany(() => Trip, (trip) => trip.calendar)
	trips: Trip[];

	@OneToMany(() => CalendarDate, (calendarDate) => calendarDate.calendar)
	exceptions: CalendarDate[];

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updatedAt' })
	updatedAt: Date;
}
