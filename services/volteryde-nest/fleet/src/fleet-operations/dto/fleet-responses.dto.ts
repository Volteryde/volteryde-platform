// ============================================================================
// Fleet Operations Response DTOs
// ============================================================================
// Response schemas for Swagger documentation

import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus, VehicleType } from '../entities/vehicle.entity';
import { DriverStatus } from '../entities/driver.entity';
import { MaintenanceStatus, MaintenanceType } from '../entities/maintenance-record.entity';

// ============================================================================
// Vehicle Response DTOs
// ============================================================================

export class VehicleResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ example: 'GH-1234-20' })
  registrationNumber: string;

  @ApiProperty({ example: 'BYD' })
  make: string;

  @ApiProperty({ example: 'K9 Electric Bus' })
  model: string;

  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ enum: VehicleType, example: VehicleType.BUS })
  type: VehicleType;

  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.ACTIVE })
  status: VehicleStatus;

  @ApiProperty({ example: 50 })
  capacity: number;

  @ApiProperty({ example: 324 })
  batteryCapacity: number;

  @ApiProperty({ example: 12500 })
  currentOdometer: number;

  @ApiProperty({ example: 85, required: false })
  currentBatteryLevel?: number;

  @ApiProperty({ example: 'DRV-001', required: false })
  currentDriverId?: string;

  @ApiProperty({ example: '2024-11-14T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-14T16:00:00Z' })
  updatedAt: Date;
}

export class UpdateVehicleStatusDto {
  @ApiProperty({
    description: 'New vehicle status',
    enum: VehicleStatus,
    example: VehicleStatus.IN_MAINTENANCE,
  })
  status: VehicleStatus;
}

export class AssignDriverDto {
  @ApiProperty({
    description: 'Driver ID to assign to vehicle',
    example: 'DRV-001',
  })
  driverId: string;
}

// ============================================================================
// Driver Response DTOs
// ============================================================================

export class DriverResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'DRV-001' })
  driverId: string;

  @ApiProperty({ example: 'Kwame' })
  firstName: string;

  @ApiProperty({ example: 'Mensah' })
  lastName: string;

  @ApiProperty({ example: 'kwame.mensah@volteryde.com' })
  email: string;

  @ApiProperty({ example: '+233-24-123-4567' })
  phone: string;

  @ApiProperty({ example: 'GH-LIC-123456' })
  licenseNumber: string;

  @ApiProperty({ example: '2026-12-31T00:00:00Z' })
  licenseExpiry: Date;

  @ApiProperty({ enum: DriverStatus, example: DriverStatus.ACTIVE })
  status: DriverStatus;

  @ApiProperty({ example: 92.5, description: 'Driver rating out of 100' })
  rating: number;

  @ApiProperty({ example: 142, description: 'Total trips completed' })
  totalTrips: number;

  @ApiProperty({ example: 1250.5, description: 'Total kilometers driven' })
  totalDistance: number;

  @ApiProperty({ example: 45.2, description: 'Average speed in km/h' })
  averageSpeed: number;

  @ApiProperty({ example: 88.5, description: 'Driver safety score out of 100' })
  driverScore: number;

  @ApiProperty({ example: 3 })
  harshBrakingCount: number;

  @ApiProperty({ example: 2 })
  rapidAccelerationCount: number;

  @ApiProperty({ example: 1 })
  speedingIncidents: number;

  @ApiProperty({ example: 'VEH-001', required: false })
  currentVehicleId?: string;

  @ApiProperty({ example: '2024-11-14T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-14T16:00:00Z' })
  lastActiveDate: Date;
}

export class CreateDriverDto {
  @ApiProperty({ example: 'DRV-001' })
  driverId: string;

  @ApiProperty({ example: 'Kwame' })
  firstName: string;

  @ApiProperty({ example: 'Mensah' })
  lastName: string;

  @ApiProperty({ example: 'kwame.mensah@volteryde.com' })
  email: string;

  @ApiProperty({ example: '+233-24-123-4567' })
  phone: string;

  @ApiProperty({ example: 'GH-LIC-123456' })
  licenseNumber: string;

  @ApiProperty({ example: '2026-12-31' })
  licenseExpiry: Date;

  @ApiProperty({
    example: { name: 'Ama Mensah', phone: '+233-24-987-6543', relationship: 'Spouse' },
    required: false,
  })
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export class UpdateDriverStatusDto {
  @ApiProperty({
    enum: DriverStatus,
    example: DriverStatus.ON_LEAVE,
  })
  status: DriverStatus;
}

// ============================================================================
// Maintenance Response DTOs
// ============================================================================

export class MaintenanceRecordResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.ROUTINE })
  type: MaintenanceType;

  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.COMPLETED })
  status: MaintenanceStatus;

  @ApiProperty({ example: 'Regular 10,000 km service - oil, filters, brake check' })
  description: string;

  @ApiProperty({ example: 1500.50 })
  cost: number;

  @ApiProperty({ example: 'John Doe, Certified Mechanic' })
  performedBy: string;

  @ApiProperty({ example: '2024-11-15T09:00:00Z' })
  scheduledDate: Date;

  @ApiProperty({ example: '2024-11-15T14:30:00Z', required: false })
  completedDate?: Date;

  @ApiProperty({ example: 10250 })
  odometerReading: number;

  @ApiProperty({ example: 'All systems checked. Vehicle in excellent condition.' })
  notes: string;

  @ApiProperty({
    example: [
      { name: 'Brake Pads', quantity: 4, cost: 400 },
      { name: 'Air Filter', quantity: 2, cost: 150 },
    ],
    required: false,
  })
  partsReplaced?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;

  @ApiProperty({ example: '2024-11-14T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-15T14:30:00Z' })
  updatedAt: Date;
}

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.ROUTINE })
  type: MaintenanceType;

  @ApiProperty({ example: 'Regular 10,000 km service' })
  description: string;

  @ApiProperty({ example: '2024-11-15T09:00:00Z' })
  scheduledDate: Date;

  @ApiProperty({ example: 10250 })
  odometerReading: number;

  @ApiProperty({ example: 'Check all systems', required: false })
  notes?: string;
}

export class UpdateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.COMPLETED })
  status: MaintenanceStatus;

  @ApiProperty({ example: 1500.50, required: false })
  cost?: number;

  @ApiProperty({ example: 'John Doe', required: false })
  performedBy?: string;

  @ApiProperty({ example: '2024-11-15T14:30:00Z', required: false })
  completedDate?: Date;

  @ApiProperty({ example: 'Service completed successfully', required: false })
  notes?: string;

  @ApiProperty({
    example: [{ name: 'Brake Pads', quantity: 4, cost: 400 }],
    required: false,
  })
  partsReplaced?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
}

// ============================================================================
// Fleet Statistics Response DTO
// ============================================================================

export class FleetStatsResponseDto {
  @ApiProperty({ example: 25, description: 'Total vehicles in fleet' })
  totalVehicles: number;

  @ApiProperty({ example: 20, description: 'Active vehicles' })
  activeVehicles: number;

  @ApiProperty({ example: 3, description: 'Vehicles in maintenance' })
  inMaintenance: number;

  @ApiProperty({ example: 2, description: 'Out of service vehicles' })
  outOfService: number;

  @ApiProperty({ example: 50, description: 'Total drivers' })
  totalDrivers: number;

  @ApiProperty({ example: 45, description: 'Active drivers' })
  activeDrivers: number;

  @ApiProperty({ example: 15234.5, description: 'Total fleet kilometers' })
  totalDistance: number;

  @ApiProperty({ example: 42.5, description: 'Average fleet utilization %' })
  averageUtilization: number;

  @ApiProperty({ example: 87.5, description: 'Average driver score' })
  averageDriverScore: number;
}
