// ============================================================================
// Vehicle Entity
// ============================================================================
// TypeORM entity for electric vehicles in the fleet

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Driver } from './driver.entity';
import { MaintenanceRecord } from './maintenance-record.entity';

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum VehicleType {
  BUS = 'BUS',
  VAN = 'VAN',
  SEDAN = 'SEDAN',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  vehicleId: string; // e.g., VEH-001

  @Column()
  registrationNumber: string;

  @Column()
  make: string; // e.g., Tesla, BYD

  @Column()
  model: string;

  @Column()
  year: number;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.BUS,
  })
  type: VehicleType;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
  })
  status: VehicleStatus;

  @Column({ type: 'int' })
  capacity: number; // Number of passengers

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  batteryCapacity: number; // kWh

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentOdometer: number; // km

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  currentBatteryLevel: number; // percentage

  @Column({ nullable: true })
  currentDriverId: string;

  @ManyToOne(() => Driver, (driver) => driver.vehicles, { nullable: true })
  currentDriver: Driver;

  @OneToMany(() => MaintenanceRecord, (record) => record.vehicle)
  maintenanceRecords: MaintenanceRecord[];

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>; // Additional specs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastMaintenanceDate: Date;

  @Column({ nullable: true })
  nextMaintenanceDue: Date;
}
