// ============================================================================
// DriverVehicleAssignment Entity
// ============================================================================
// TypeORM entity for explicit assignment of a driver to a vehicle

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Vehicle } from './vehicle.entity';

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  REVOKED = 'REVOKED',
}

@Entity('driver_vehicle_assignments')
export class DriverVehicleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Driver, { eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @ManyToOne(() => Vehicle, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ type: 'timestamp with time zone' })
  assignmentStartTime: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  assignmentEndTime: Date;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
