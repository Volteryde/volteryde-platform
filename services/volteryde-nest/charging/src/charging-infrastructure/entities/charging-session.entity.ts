// ============================================================================
// Charging Session Entity
// ============================================================================
// TypeORM entity for charging sessions

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ChargingStation } from './charging-station.entity';

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('charging_sessions')
export class ChargingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stationId: string;

  @Column()
  connectorId: string;

  @Column()
  userId: string;

  @Column()
  vehicleId: string;

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  energyConsumedKwh: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.IN_PROGRESS,
  })
  status: SessionStatus;

  @ManyToOne(() => ChargingStation, (station) => station.chargingSessions)
  station: ChargingStation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
