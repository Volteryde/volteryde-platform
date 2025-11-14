// ============================================================================
// Create Vehicle DTO
// ============================================================================
// Input validation for adding new vehicles to fleet

import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType, VehicleStatus } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Unique vehicle identifier',
    example: 'VEH-001',
    type: String,
  })
  @IsString()
  vehicleId: string;

  @ApiProperty({
    description: 'Official registration/license plate number',
    example: 'GH-1234-20',
    type: String,
  })
  @IsString()
  registrationNumber: string;

  @ApiProperty({
    description: 'Vehicle manufacturer',
    example: 'BYD',
    type: String,
  })
  @IsString()
  make: string;

  @ApiProperty({
    description: 'Vehicle model name',
    example: 'K9 Electric Bus',
    type: String,
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Manufacturing year',
    example: 2024,
    type: Number,
  })
  @IsNumber()
  @Min(2015)
  @Max(2030)
  year: number;

  @ApiProperty({
    description: 'Type of vehicle',
    enum: VehicleType,
    example: VehicleType.BUS,
  })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({
    description: 'Number of passenger seats',
    example: 50,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: 'Battery capacity in kilowatt-hours (kWh)',
    example: 324,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  batteryCapacity: number;

  @ApiProperty({
    description: 'Current odometer reading in kilometers',
    example: 0,
    type: Number,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentOdometer?: number;

  @ApiProperty({
    description: 'Additional vehicle specifications (JSON)',
    example: { color: 'White', features: ['AC', 'WiFi', 'USB Charging'] },
    required: false,
  })
  @IsOptional()
  specifications?: Record<string, any>;
}
