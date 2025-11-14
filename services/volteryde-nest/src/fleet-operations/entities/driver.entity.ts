// ============================================================================
// Driver Entity
// ============================================================================
// TypeORM entity for drivers in the fleet

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  driverId: string; // e.g., DRV-001

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column()
  licenseExpiry: Date;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.ACTIVE,
  })
  status: DriverStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rating: number; // 0-100

  @Column({ type: 'int', default: 0 })
  totalTrips: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDistance: number; // km

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageSpeed: number; // km/h

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  driverScore: number; // 0-100

  @Column({ type: 'int', default: 0 })
  harshBrakingCount: number;

  @Column({ type: 'int', default: 0 })
  rapidAccelerationCount: number;

  @Column({ type: 'int', default: 0 })
  speedingIncidents: number;

  @Column({ nullable: true })
  currentVehicleId: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.currentDriver)
  vehicles: Vehicle[];

  @Column({ type: 'jsonb', nullable: true })
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastActiveDate: Date;
}
