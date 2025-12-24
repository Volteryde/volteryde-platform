// ============================================================================
// Maintenance Record Entity
// ============================================================================
// TypeORM entity for vehicle maintenance records

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

export enum MaintenanceType {
  ROUTINE = 'ROUTINE',
  EMERGENCY = 'EMERGENCY',
  INSPECTION = 'INSPECTION',
  REPAIR = 'REPAIR',
  BATTERY_SERVICE = 'BATTERY_SERVICE',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('maintenance_records')
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenanceRecords)
  vehicle: Vehicle;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
  })
  type: MaintenanceType;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ nullable: true })
  performedBy: string; // Technician/mechanic name

  @Column()
  scheduledDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  odometerReading: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  partsReplaced: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
