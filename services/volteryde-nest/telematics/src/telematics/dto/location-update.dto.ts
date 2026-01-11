// ============================================================================
// Location Update DTO
// ============================================================================
// Validates location data from driver app telemetry
// Extended with EV battery fields per technical architecture

import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  Min,
  Max,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// GTFS-RT Compatible Occupancy Status
export enum OccupancyStatus {
  EMPTY = 'EMPTY',
  MANY_SEATS_AVAILABLE = 'MANY_SEATS_AVAILABLE',
  FEW_SEATS_AVAILABLE = 'FEW_SEATS_AVAILABLE',
  STANDING_ROOM_ONLY = 'STANDING_ROOM_ONLY',
  CRUSHED_STANDING_ROOM_ONLY = 'CRUSHED_STANDING_ROOM_ONLY',
  FULL = 'FULL',
  NOT_ACCEPTING_PASSENGERS = 'NOT_ACCEPTING_PASSENGERS',
}

export enum ChargingState {
  NOT_CHARGING = 'NOT_CHARGING',
  CHARGING = 'CHARGING',
  CHARGING_COMPLETE = 'CHARGING_COMPLETE',
  REGENERATIVE_BRAKING = 'REGENERATIVE_BRAKING',
}

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

  @ApiPropertyOptional({
    description: 'Vehicle speed in kilometers per hour',
    example: 45,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({
    description: 'Vehicle heading/direction in degrees (0-360, where 0/360 is North)',
    example: 180,
    minimum: 0,
    maximum: 360,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({
    description: 'GPS accuracy in meters',
    example: 5.2,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Timestamp of the location reading (ISO 8601)',
    example: '2026-01-10T12:00:00Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timestamp?: Date;

  @ApiPropertyOptional({
    description: 'Indicates if the location is from a mocked provider (e.g., fake GPS app)',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isMocked?: boolean;

  // ============================================================================
  // EV Battery Fields (Technical Architecture Section 2.2 & 4.2)
  // ============================================================================

  @ApiPropertyOptional({
    description: 'Current battery level as percentage (0-100)',
    example: 75.5,
    minimum: 0,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevelPercent?: number;

  @ApiPropertyOptional({
    description: 'Current charging state of the vehicle',
    enum: ChargingState,
    example: ChargingState.NOT_CHARGING,
  })
  @IsOptional()
  @IsEnum(ChargingState)
  chargingState?: ChargingState;

  @ApiPropertyOptional({
    description: 'Estimated remaining range in kilometers based on current battery',
    example: 180.5,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingRangeKm?: number;

  @ApiPropertyOptional({
    description: 'Battery voltage reading in volts',
    example: 400.2,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  voltage?: number;

  @ApiPropertyOptional({
    description: 'Battery current in amperes (negative = discharging, positive = charging)',
    example: -25.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  current?: number;

  @ApiPropertyOptional({
    description: 'Battery temperature in Celsius',
    example: 32.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  batteryTemperature?: number;

  @ApiPropertyOptional({
    description: 'State of Charge from BMS (more accurate than displayed percentage)',
    example: 74.8,
    minimum: 0,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  stateOfCharge?: number;

  @ApiPropertyOptional({
    description: 'Energy consumed since trip start in kWh',
    example: 12.5,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  energyConsumedKwh?: number;

  @ApiPropertyOptional({
    description: 'Energy regenerated through regenerative braking in kWh',
    example: 2.3,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  energyRegeneratedKwh?: number;

  // ============================================================================
  // GTFS Trip Linking (Technical Architecture Section 4.2)
  // ============================================================================

  @ApiPropertyOptional({
    description: 'GTFS trip_id this vehicle is currently serving',
    example: 'TRIP-101-0900',
    type: String,
  })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiPropertyOptional({
    description: 'Current delay in seconds (negative = early, positive = late)',
    example: 120,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  delaySeconds?: number;

  @ApiPropertyOptional({
    description: 'ID of the stop the vehicle is currently at or approaching',
    example: 'STOP-OSU-003',
    type: String,
  })
  @IsOptional()
  @IsString()
  currentStopId?: string;

  @ApiPropertyOptional({
    description: 'Stop sequence number in the current trip',
    example: 3,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStopSequence?: number;

  // ============================================================================
  // Passenger Occupancy (GTFS-RT Compatible)
  // ============================================================================

  @ApiPropertyOptional({
    description: 'Current passenger occupancy status (GTFS-RT compatible)',
    enum: OccupancyStatus,
    example: OccupancyStatus.MANY_SEATS_AVAILABLE,
  })
  @IsOptional()
  @IsEnum(OccupancyStatus)
  occupancyStatus?: OccupancyStatus;

  @ApiPropertyOptional({
    description: 'Current number of passengers on board',
    example: 15,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passengerCount?: number;

  @ApiPropertyOptional({
    description: 'Percentage of seats occupied (0-100)',
    example: 37.5,
    minimum: 0,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  occupancyPercent?: number;

  // ============================================================================
  // Driver & Diagnostics
  // ============================================================================

  @ApiPropertyOptional({
    description: 'Driver ID currently operating this vehicle',
    example: 'DRV-001',
    type: String,
  })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({
    description: 'Vehicle odometer reading in kilometers',
    example: 45230.5,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerKm?: number;
}

