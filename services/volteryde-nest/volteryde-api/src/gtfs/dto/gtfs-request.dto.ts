// ============================================================================
// GTFS DTOs - Request DTOs
// ============================================================================
// Data Transfer Objects for GTFS API requests

import {
	IsString,
	IsNumber,
	IsOptional,
	IsBoolean,
	IsEnum,
	IsArray,
	Min,
	Max,
	IsDateString,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RouteType } from '../entities/route.entity';
import { LocationType } from '../entities/stop.entity';

// ============================================================================
// Stop DTOs
// ============================================================================

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
		description: 'Search radius in meters',
		example: 500,
		default: 500,
		minimum: 50,
		maximum: 5000,
	})
	@IsOptional()
	@IsNumber()
	@Min(50)
	@Max(5000)
	@Type(() => Number)
	radius?: number = 500;

	@ApiPropertyOptional({
		description: 'Maximum number of results',
		example: 10,
		default: 10,
		minimum: 1,
		maximum: 50,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(50)
	@Type(() => Number)
	limit?: number = 10;

	@ApiPropertyOptional({
		description: 'Filter by location type',
		enum: LocationType,
		example: LocationType.STOP,
	})
	@IsOptional()
	@IsEnum(LocationType)
	locationType?: LocationType;

	@ApiPropertyOptional({
		description: 'Only return charging stations',
		example: false,
	})
	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	chargingOnly?: boolean;
}

export class CreateStopDto {
	@ApiProperty({ description: 'Unique stop identifier', example: 'STOP-001' })
	@IsString()
	stopId: string;

	@ApiProperty({ description: 'Stop name', example: 'Accra Central Station' })
	@IsString()
	stopName: string;

	@ApiProperty({ description: 'Latitude', example: 5.5502 })
	@IsNumber()
	@Min(-90)
	@Max(90)
	stopLat: number;

	@ApiProperty({ description: 'Longitude', example: -0.2174 })
	@IsNumber()
	@Min(-180)
	@Max(180)
	stopLon: number;

	@ApiPropertyOptional({ description: 'Short code for passengers', example: 'ACS' })
	@IsOptional()
	@IsString()
	stopCode?: string;

	@ApiPropertyOptional({ description: 'Stop description' })
	@IsOptional()
	@IsString()
	stopDesc?: string;

	@ApiPropertyOptional({ description: 'Zone ID for fare calculation' })
	@IsOptional()
	@IsString()
	zoneId?: string;

	@ApiPropertyOptional({ description: 'Is this a charging station?', default: false })
	@IsOptional()
	@IsBoolean()
	isChargingStation?: boolean;
}

// ============================================================================
// Route DTOs
// ============================================================================

export class CreateRouteDto {
	@ApiProperty({ description: 'Unique route identifier', example: 'RT-101' })
	@IsString()
	routeId: string;

	@ApiProperty({ description: 'Short name', example: '101' })
	@IsString()
	routeShortName: string;

	@ApiProperty({ description: 'Long descriptive name', example: 'Accra Central to Tema Station' })
	@IsString()
	routeLongName: string;

	@ApiPropertyOptional({ description: 'Agency ID' })
	@IsOptional()
	@IsString()
	agencyId?: string;

	@ApiPropertyOptional({ description: 'Route type', enum: RouteType, default: RouteType.BUS })
	@IsOptional()
	@IsEnum(RouteType)
	routeType?: RouteType;

	@ApiPropertyOptional({ description: 'Route color (hex)', example: '00FF00' })
	@IsOptional()
	@IsString()
	routeColor?: string;

	@ApiPropertyOptional({ description: 'Base fare in GHS', example: 5.0 })
	@IsOptional()
	@IsNumber()
	baseFare?: number;

	@ApiPropertyOptional({ description: 'Fare per km in GHS', example: 0.5 })
	@IsOptional()
	@IsNumber()
	farePerKm?: number;
}

export class RoutesQueryDto {
	@ApiPropertyOptional({ description: 'Filter by agency ID' })
	@IsOptional()
	@IsString()
	agencyId?: string;

	@ApiPropertyOptional({ description: 'Filter by route type', enum: RouteType })
	@IsOptional()
	@IsEnum(RouteType)
	routeType?: RouteType;

	@ApiPropertyOptional({ description: 'Only active routes', default: true })
	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	activeOnly?: boolean = true;
}

// ============================================================================
// Trip DTOs
// ============================================================================

export class TripsQueryDto {
	@ApiPropertyOptional({ description: 'Filter by route ID' })
	@IsOptional()
	@IsString()
	routeId?: string;

	@ApiPropertyOptional({ description: 'Filter by service date (YYYY-MM-DD)', example: '2026-01-15' })
	@IsOptional()
	@IsDateString()
	date?: string;

	@ApiPropertyOptional({ description: 'Filter by stop ID (trips that visit this stop)' })
	@IsOptional()
	@IsString()
	stopId?: string;

	@ApiPropertyOptional({ description: 'Only trips with available seats', default: false })
	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	availableOnly?: boolean;

	@ApiPropertyOptional({ description: 'Minimum departure time (HH:MM)', example: '09:00' })
	@IsOptional()
	@IsString()
	afterTime?: string;
}

export class CreateTripDto {
	@ApiProperty({ description: 'Unique trip identifier', example: 'TRIP-101-0900' })
	@IsString()
	tripId: string;

	@ApiProperty({ description: 'Route ID', example: 'RT-101' })
	@IsString()
	routeId: string;

	@ApiProperty({ description: 'Service ID (calendar)', example: 'WEEKDAY' })
	@IsString()
	serviceId: string;

	@ApiPropertyOptional({ description: 'Destination headsign', example: 'Tema Station' })
	@IsOptional()
	@IsString()
	tripHeadsign?: string;

	@ApiPropertyOptional({ description: 'Block ID for vehicle assignment' })
	@IsOptional()
	@IsString()
	blockId?: string;

	@ApiPropertyOptional({ description: 'Seat capacity', example: 40 })
	@IsOptional()
	@IsNumber()
	capacity?: number;
}

// ============================================================================
// Schedule/Sync DTOs
// ============================================================================

export class ScheduleQueryDto {
	@ApiProperty({ description: 'Stop ID to get schedule for', example: 'STOP-001' })
	@IsString()
	stopId: string;

	@ApiPropertyOptional({ description: 'Filter by route ID' })
	@IsOptional()
	@IsString()
	routeId?: string;

	@ApiPropertyOptional({ description: 'Date for schedule (YYYY-MM-DD)', example: '2026-01-15' })
	@IsOptional()
	@IsDateString()
	date?: string;

	@ApiPropertyOptional({ description: 'Start time filter (HH:MM)', example: '08:00' })
	@IsOptional()
	@IsString()
	startTime?: string;

	@ApiPropertyOptional({ description: 'End time filter (HH:MM)', example: '18:00' })
	@IsOptional()
	@IsString()
	endTime?: string;

	@ApiPropertyOptional({ description: 'Number of upcoming departures', default: 10 })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	limit?: number = 10;
}

export class SyncQueryDto {
	@ApiProperty({
		description: 'Current client data version',
		example: 105,
		minimum: 0,
	})
	@IsNumber()
	@Min(0)
	@Type(() => Number)
	version: number;

	@ApiPropertyOptional({
		description: 'Entities to sync (comma-separated)',
		example: 'stops,routes,trips',
	})
	@IsOptional()
	@IsString()
	entities?: string;
}

// ============================================================================
// Availability DTOs
// ============================================================================

export class AvailabilityQueryDto {
	@ApiProperty({ description: 'Trip ID', example: 'TRIP-101-0900' })
	@IsString()
	tripId: string;

	@ApiProperty({ description: 'Origin stop ID', example: 'STOP-001' })
	@IsString()
	fromStopId: string;

	@ApiProperty({ description: 'Destination stop ID', example: 'STOP-005' })
	@IsString()
	toStopId: string;

	@ApiPropertyOptional({ description: 'Number of seats needed', default: 1 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(10)
	@Type(() => Number)
	seatCount?: number = 1;
}
