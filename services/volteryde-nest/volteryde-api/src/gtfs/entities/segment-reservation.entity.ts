// ============================================================================
// SegmentReservation Entity
// ============================================================================
// Links bookings to trip segments for proper inventory management
// A booking from Stop A to Stop C creates reservations for segments A→B and B→C

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	Index,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { TripSegment } from './trip-segment.entity';

export enum ReservationStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED',
	EXPIRED = 'EXPIRED',
	USED = 'USED',
}

@Entity('gtfs_segment_reservations')
@Index(['bookingId'])
@Index(['segmentId', 'status'])
export class SegmentReservation {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'segmentId' })
	segmentId: string; // FK to TripSegment

	@ManyToOne(() => TripSegment, (segment) => segment.reservations)
	@JoinColumn({ name: 'segmentId' })
	segment: TripSegment;

	@Column({ name: 'bookingId' })
	bookingId: string; // FK to Booking entity

	@Column({ name: 'userId' })
	userId: string; // User who made the reservation

	@Column({
		name: 'status',
		type: 'enum',
		enum: ReservationStatus,
		default: ReservationStatus.PENDING,
	})
	status: ReservationStatus;

	@Column({ name: 'seatCount', type: 'int', default: 1 })
	seatCount: number; // Number of seats reserved

	@Column({ name: 'seatNumber', nullable: true })
	seatNumber: string; // Specific seat if assigned (e.g., "12A")

	@Column({ name: 'expiresAt', type: 'timestamp', nullable: true })
	expiresAt: Date; // Reservation expiry for pending bookings

	@Column({ name: 'confirmedAt', type: 'timestamp', nullable: true })
	confirmedAt: Date; // When payment was confirmed

	@Column({ name: 'usedAt', type: 'timestamp', nullable: true })
	usedAt: Date; // When passenger actually boarded

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;
}
