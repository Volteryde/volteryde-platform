// ============================================================================
// Booking DTOs - Response DTOs for Stop-to-Stop Model
// ============================================================================
// Austin: Response DTOs for the stop-to-stop booking API.
// These define the shape of data returned to clients.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// Stop Response (used in multiple responses)
// ============================================================================

export class StopResponseDto {
  @ApiProperty({ description: 'GTFS Stop ID' })
  stopId: string;

  @ApiProperty({ description: 'Stop name' })
  name: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  lng: number;

  @ApiPropertyOptional({ description: 'H3 cell index at resolution 10' })
  h3Index?: string;

  @ApiPropertyOptional({ description: 'Distance from query point in meters' })
  distanceMeters?: number;

  @ApiPropertyOptional({ description: 'Walking time estimate in seconds' })
  walkingTimeSeconds?: number;
}

// ============================================================================
// Fare Breakdown Response
// ============================================================================

export class FareBreakdownDto {
  @ApiProperty({ description: 'Base fare in cedis' })
  baseFare: number;

  @ApiProperty({ description: 'Distance-based fare in cedis' })
  distanceFare: number;

  @ApiProperty({ description: 'Total fare in cedis' })
  totalFare: number;

  @ApiProperty({ description: 'Pricing zone (CBD, URBAN, SUBURBAN, PERIURBAN)' })
  pricingZone: string;

  @ApiProperty({ description: 'Distance in kilometers' })
  distanceKm: number;

  @ApiPropertyOptional({ description: 'Per-passenger fare if multiple passengers' })
  perPassengerFare?: number;
}

// ============================================================================
// Fare Estimate Response
// ============================================================================

export class FareEstimateResponseDto {
  @ApiProperty({ description: 'Pickup stop details', type: StopResponseDto })
  pickupStop: StopResponseDto;

  @ApiProperty({ description: 'Dropoff stop details', type: StopResponseDto })
  dropoffStop: StopResponseDto;

  @ApiProperty({ description: 'Distance between stops in meters' })
  distanceMeters: number;

  @ApiProperty({ description: 'Estimated travel time in seconds' })
  estimatedDurationSeconds: number;

  @ApiProperty({ description: 'Fare breakdown', type: FareBreakdownDto })
  fare: FareBreakdownDto;

  @ApiPropertyOptional({ description: 'Next available departure time' })
  nextDepartureTime?: string;
}

// ============================================================================
// Nearby Stops Response
// ============================================================================

export class NearbyStopsResponseDto {
  @ApiProperty({ description: 'List of nearby stops', type: [StopResponseDto] })
  stops: StopResponseDto[];

  @ApiProperty({ description: 'Query coordinates' })
  queryLocation: {
    lat: number;
    lng: number;
  };

  @ApiProperty({ description: 'Search radius used in meters' })
  radiusMeters: number;

  @ApiProperty({ description: 'Total stops found' })
  totalFound: number;
}

// ============================================================================
// Booking Confirmation Response
// ============================================================================

export class BookingConfirmationDto {
  @ApiProperty({ description: 'Booking/Workflow ID' })
  bookingId: string;

  @ApiProperty({ description: 'Workflow run ID (for tracking)' })
  runId: string;

  @ApiProperty({
    description: 'Current booking status',
    enum: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'],
  })
  status: string;

  @ApiProperty({ description: 'Status message' })
  message: string;

  @ApiProperty({ description: 'Pickup stop details', type: StopResponseDto })
  pickupStop: StopResponseDto;

  @ApiProperty({ description: 'Dropoff stop details', type: StopResponseDto })
  dropoffStop: StopResponseDto;

  @ApiProperty({ description: 'Fare breakdown', type: FareBreakdownDto })
  fare: FareBreakdownDto;

  @ApiPropertyOptional({ description: 'Assigned vehicle ID' })
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Estimated time of arrival in minutes' })
  etaMinutes?: number;

  @ApiPropertyOptional({ description: 'Scheduled departure time' })
  scheduledDepartureTime?: string;

  @ApiProperty({ description: 'Booking creation timestamp' })
  createdAt: string;
}

// ============================================================================
// Booking Status Response
// ============================================================================

export class BookingStatusResponseDto {
  @ApiProperty({ description: 'Booking/Workflow ID' })
  bookingId: string;

  @ApiProperty({
    description: 'Current booking status',
    enum: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'],
  })
  status: string;

  @ApiPropertyOptional({ description: 'Status message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Pickup stop details', type: StopResponseDto })
  pickupStop?: StopResponseDto;

  @ApiPropertyOptional({ description: 'Dropoff stop details', type: StopResponseDto })
  dropoffStop?: StopResponseDto;

  @ApiPropertyOptional({ description: 'Assigned vehicle ID' })
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Vehicle current location' })
  vehicleLocation?: {
    lat: number;
    lng: number;
  };

  @ApiPropertyOptional({ description: 'Estimated time of arrival in minutes' })
  etaMinutes?: number;

  @ApiPropertyOptional({ description: 'Driver/Operator name' })
  driverName?: string;

  @ApiPropertyOptional({ description: 'Vehicle plate number' })
  vehiclePlate?: string;
}

// ============================================================================
// Route Stops Response
// ============================================================================

export class RouteStopsResponseDto {
  @ApiProperty({ description: 'Route ID' })
  routeId: string;

  @ApiProperty({ description: 'Route name' })
  routeName: string;

  @ApiPropertyOptional({ description: 'Direction ID' })
  directionId?: number;

  @ApiProperty({ description: 'Ordered list of stops on this route', type: [StopResponseDto] })
  stops: StopResponseDto[];

  @ApiProperty({ description: 'Total number of stops' })
  totalStops: number;
}
