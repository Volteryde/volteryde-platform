// ============================================================================
// Charging Station Entity
// ============================================================================
// TypeORM entity for charging stations

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChargingSession } from './charging-session.entity';

export enum StationStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ConnectorType {
  CCS = 'CCS',
  CHADEMO = 'CHADEMO',
  TYPE_2 = 'TYPE_2',
  TESLA = 'TESLA',
}

@Entity('charging_stations')
export class ChargingStation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  stationId: string; // e.g., CHG-001

  @Column()
  name: string;

  @Column('text')
  address: string;

  @Column('decimal', { precision: 10, scale: 6 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6 })
  longitude: number;

  @Column({
    type: 'enum',
    enum: StationStatus,
    default: StationStatus.AVAILABLE,
  })
  status: StationStatus;

  @Column({ type: 'int' })
  connectorCount: number;

  @Column({
    type: 'jsonb',
    default: () => "'[]'",
  })
  connectors: Array<{
    connectorId: string;
    type: ConnectorType;
    powerKw: number;
    isAvailable: boolean;
  }>;

  @OneToMany(() => ChargingSession, (session) => session.station)
  chargingSessions: ChargingSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
