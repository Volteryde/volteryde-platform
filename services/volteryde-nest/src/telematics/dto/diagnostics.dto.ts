// ============================================================================
// Diagnostics DTO
// ============================================================================
// Validates vehicle diagnostics data

import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DiagnosticsDto {
  @ApiProperty({
    description: 'Unique identifier for the vehicle',
    example: 'VEH-001',
    type: String,
  })
  @IsString()
  vehicleId: string;

  @ApiProperty({
    description: 'Battery level as a percentage (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevel: number;

  @ApiProperty({
    description: 'Battery temperature in degrees Celsius',
    example: 35,
    minimum: -50,
    maximum: 100,
    type: Number,
  })
  @IsNumber()
  @Min(-50)
  @Max(100)
  batteryTemperature: number;

  @ApiProperty({
    description: 'Motor temperature in degrees Celsius',
    example: 70,
    minimum: -50,
    maximum: 150,
    type: Number,
  })
  @IsNumber()
  @Min(-50)
  @Max(150)
  motorTemperature: number;

  @ApiProperty({
    description: 'Current speed in kilometers per hour',
    example: 45,
    minimum: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  speed: number;

  @ApiProperty({
    description: 'Total distance traveled in kilometers',
    example: 12500,
    minimum: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  odometer: number;
}
