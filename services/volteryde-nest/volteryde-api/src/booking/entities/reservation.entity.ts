// ============================================================================
// Reservation Entity
// ============================================================================
// TypeORM entity for seat reservations

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'reservations', schema: process.env.BOOKING_DATABASE_SCHEMA || 'svc_booking' })
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  vehicleId: string;

  @Column({ nullable: true })
  seatId: string;

  @Column()
  expiresAt: Date;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
