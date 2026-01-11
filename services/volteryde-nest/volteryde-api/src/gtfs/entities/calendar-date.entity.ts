// ============================================================================
// CalendarDate Entity
// ============================================================================
// GTFS-compliant entity for service exceptions (holidays, special days)
// Reference: https://gtfs.org/schedule/reference/#calendar_datestxt

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
import { Calendar } from './calendar.entity';

export enum ExceptionType {
	SERVICE_ADDED = 1,   // Service added for this date
	SERVICE_REMOVED = 2, // Service removed for this date
}

@Entity('gtfs_calendar_dates')
@Index(['date'])
@Unique(['serviceId', 'date'])
export class CalendarDate {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'serviceId' })
	serviceId: string; // service_id (FK)

	@ManyToOne(() => Calendar, (calendar) => calendar.exceptions, { nullable: true })
	@JoinColumn({ name: 'serviceId', referencedColumnName: 'serviceId' })
	calendar: Calendar;

	@Column({ name: 'date', type: 'date' })
	date: Date; // date (YYYYMMDD)

	@Column({
		name: 'exceptionType',
		type: 'int',
	})
	exceptionType: number; // exception_type

	// ============================================================================
	// VolteRyde Extensions
	// ============================================================================

	@Column({ name: 'reason', nullable: true })
	reason: string; // Reason for exception (e.g., "Ghana Independence Day")

	@Column({ name: 'alternativeServiceId', nullable: true })
	alternativeServiceId: string; // Alternative service if this one is removed

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;
}
