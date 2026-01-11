// ============================================================================
// TripSegment Entity
// ============================================================================
// Represents atomic segments between consecutive stops for inventory management
// This enables proper segment-based seat availability for overlapping bookings

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	Index,
	ManyToOne,
	JoinColumn,
	OneToMany,
} from 'typeorm';
import { Trip } from './trip.entity';
import { Stop } from './stop.entity';

@Entity('gtfs_trip_segments')
@Index(['tripId', 'sequence'])
@Index(['fromStopId', 'toStopId'])
export class TripSegment {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'tripId' })
	tripId: string; // FK to Trip

	@ManyToOne(() => Trip)
	@JoinColumn({ name: 'tripId', referencedColumnName: 'tripId' })
	trip: Trip;

	@Column({ name: 'sequence', type: 'int' })
	sequence: number; // Order of segment in trip (0, 1, 2, ...)

	@Column({ name: 'fromStopId' })
	fromStopId: string; // Starting stop of segment

	@ManyToOne(() => Stop)
	@JoinColumn({ name: 'fromStopId', referencedColumnName: 'stopId' })
	fromStop: Stop;

	@Column({ name: 'toStopId' })
	toStopId: string; // Ending stop of segment

	@ManyToOne(() => Stop)
	@JoinColumn({ name: 'toStopId', referencedColumnName: 'stopId' })
	toStop: Stop;

	@Column({ name: 'capacity', type: 'int' })
	capacity: number; // Total seats available for this segment

	@Column({ name: 'reservedSeats', type: 'int', default: 0 })
	reservedSeats: number; // Currently reserved seats

	@Column({ name: 'distanceKm', type: 'decimal', precision: 10, scale: 2, nullable: true })
	distanceKm: number; // Distance of this segment

	@Column({ name: 'durationSeconds', type: 'int', nullable: true })
	durationSeconds: number; // Duration of this segment

	@Column({ name: 'segmentFare', type: 'decimal', precision: 10, scale: 2, nullable: true })
	segmentFare: number; // Fare for just this segment

	// Note: Reservations relationship defined in SegmentReservation entity to avoid circular import
	// Use service layer to fetch reservations when needed

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;
	reservations: any;

	// Computed property for availability
	get availableSeats(): number {
		return this.capacity - this.reservedSeats;
	}
}

