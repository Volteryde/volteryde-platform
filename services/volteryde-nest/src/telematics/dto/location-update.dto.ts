// ============================================================================
// Location Update DTO
// ============================================================================
// Validates location data from driver app telemetry

import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LocationUpdateDto {
  @ApiProperty({
    description: 'Unique identifier for the vehicle',
    example: 'VEH-001',
    type: String,
  })
  @IsString()
  vehicleId: string;

  @ApiProperty({
    description: 'Latitude coordinate in decimal degrees',
    example: 5.6037,
    minimum: -90,
    maximum: 90,
    type: Number,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate in decimal degrees',
    example: -0.187,
    minimum: -180,
    maximum: 180,
    type: Number,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Vehicle speed in kilometers per hour',
    example: 45,
    minimum: 0,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiProperty({
    description: 'Vehicle heading/direction in degrees (0-360, where 0/360 is North)',
    example: 180,
    minimum: 0,
    maximum: 360,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({
    description: 'GPS accuracy in meters',
    example: 5.2,
    minimum: 0,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiProperty({
    description: 'Timestamp of the location reading (ISO 8601)',
    example: '2024-11-14T16:30:00Z',
    required: false,
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timestamp?: Date;
}
