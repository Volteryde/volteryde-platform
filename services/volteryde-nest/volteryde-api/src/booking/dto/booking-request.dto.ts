// ============================================================================
// Booking DTOs - Request DTOs for Stop-to-Stop Model
// ============================================================================
// Austin: These DTOs define the stop-to-stop booking model where users
// book rides between predefined stops. Walking to/from stops is the
// user's responsibility - we handle Stop A → Stop B transportation only.

import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
  IsInt,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// Core Booking Request - Stop-to-Stop Model
// ============================================================================

/**
 * Austin: Main booking request DTO for stop-to-stop rides.
 * Users specify pickup and dropoff stops directly - no GPS coordinates needed.
 */
export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the user making the booking',
    example: 'usr_abc123xyz',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'GTFS Stop ID for pickup location',
    example: 'stop_accra_mall_001',
  })
  @IsString()
  pickupStopId: string;

  @ApiProperty({
    description: 'GTFS Stop ID for dropoff location',
    example: 'stop_circle_002',
  })
  @IsString()
  dropoffStopId: string;

  @ApiPropertyOptional({
    description: 'Number of passengers (default: 1)',
    example: 2,
    minimum: 1,
    maximum: 10,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  passengerCount?: number;

  @ApiPropertyOptional({
    description: 'Scheduled departure time (ISO 8601). If not provided, immediate booking.',
    example: '2025-01-20T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @ApiPropertyOptional({
    description: 'GTFS Trip ID if booking a specific scheduled trip',
    example: 'trip_route_37_0800',
  })
  @IsOptional()
  @IsString()
  tripId?: string;
}

// ============================================================================
// Fare Estimate Request
// ============================================================================

/**
 * Austin: Query DTO for fare estimates between two stops.
 * Returns distance, estimated duration, and fare breakdown.
 */
export class FareEstimateQueryDto {
  @ApiProperty({
    description: 'GTFS Stop ID for pickup location',
    example: 'stop_accra_mall_001',
  })
  @IsString()
  pickupStopId: string;

  @ApiProperty({
    description: 'GTFS Stop ID for dropoff location',
    example: 'stop_circle_002',
  })
  @IsString()
  dropoffStopId: string;

  @ApiPropertyOptional({
    description: 'Number of passengers for fare calculation',
    example: 2,
    minimum: 1,
    maximum: 10,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  passengerCount?: number;
}

// ============================================================================
// Nearby Stops Request
// ============================================================================

/**
 * Austin: Query DTO for finding stops near a GPS coordinate.
 * Used when user wants to find available pickup/dropoff stops nearby.
 */
export class NearbyStopsQueryDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 5.6037,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -0.187,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({
    description: 'Search radius in meters (default: 500m)',
    example: 500,
    minimum: 50,
    maximum: 2000,
    default: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(2000)
  @Type(() => Number)
  radiusMeters?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of stops to return (default: 10)',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}

// ============================================================================
// Route Search Request (for finding stops along a route)
// ============================================================================

/**
 * Austin: Query DTO for finding stops along a specific route.
 * Useful for showing users available stops on a particular bus line.
 */
export class RouteStopsQueryDto {
  @ApiProperty({
    description: 'GTFS Route ID to get stops for',
    example: 'route_37',
  })
  @IsString()
  routeId: string;

  @ApiPropertyOptional({
    description: 'Direction ID (0 = outbound, 1 = inbound)',
    example: 0,
    enum: [0, 1],
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  directionId?: number;
}

// ============================================================================
// Cancel Booking Request
// ============================================================================

export class CancelBookingDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Change of plans',
  })
  @IsString()
  reason: string;
}
