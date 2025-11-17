// ============================================================================
// Booking Entity
// ============================================================================
// TypeORM entity for bookings

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  vehicleId: string;

  @Column()
  seatId: string;

  @Column()
  reservationId: string;

  @Column()
  paymentId: string;

  @Column()
  status: string;

  @Column('decimal', { precision: 10, scale: 2 })
  fare: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
