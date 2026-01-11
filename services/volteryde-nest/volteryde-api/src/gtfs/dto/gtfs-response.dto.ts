// ============================================================================
// GTFS DTOs - Response DTOs
// ============================================================================
// Data Transfer Objects for GTFS API responses

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// Stop Response DTOs
// ============================================================================

export class StopResponseDto {
	@ApiProperty({ example: 'STOP-001' })
	stopId: string;

	@ApiProperty({ example: 'Accra Central Station' })
	stopName: string;

	@ApiPropertyOptional({ example: 'ACS' })
	stopCode?: string;

	@ApiProperty({ example: 5.5502 })
	stopLat: number;

	@ApiProperty({ example: -0.2174 })
	stopLon: number;

	@ApiPropertyOptional({ example: 'ZONE-A' })
	zoneId?: string;

	@ApiProperty({ example: 0 })
	locationType: number;

	@ApiProperty({ example: false })
	isChargingStation: boolean;

	@ApiPropertyOptional({ description: 'Distance from query point in meters', example: 150 })
	distance?: number;

	@ApiPropertyOptional({
		description: 'Amenities at this stop',
		example: { shelter: true, bench: true, lighting: true, realtimeDisplay: false },
	})
	amenities?: object;
}

export class NearbyStopsResponseDto {
	@ApiProperty({ type: [StopResponseDto] })
	stops: StopResponseDto[];

	@ApiProperty({ example: 5 })
	count: number;

	@ApiProperty({ example: { lat: 5.6037, lng: -0.187, radius: 500 } })
	query: {
		lat: number;
		lng: number;
		radius: number;
	};
}

// ============================================================================
// Route Response DTOs
// ============================================================================

export class RouteResponseDto {
	@ApiProperty({ example: 'RT-101' })
	routeId: string;

	@ApiProperty({ example: '101' })
	routeShortName: string;

	@ApiProperty({ example: 'Accra Central to Tema Station' })
	routeLongName: string;

	@ApiProperty({ example: 3 })
	routeType: number;

	@ApiProperty({ example: '00FF00' })
	routeColor: string;

	@ApiProperty({ example: 'FFFFFF' })
	routeTextColor: string;

	@ApiPropertyOptional({ example: 25.5 })
	routeDistanceKm?: number;

	@ApiPropertyOptional({ example: 45 })
	estimatedDurationMinutes?: number;

	@ApiPropertyOptional({ example: 5.0 })
	baseFare?: number;

	@ApiPropertyOptional({ example: 0.5 })
	farePerKm?: number;

	@ApiProperty({ example: true })
	isActive: boolean;

	@ApiPropertyOptional({ description: 'GeoJSON geometry of the route' })
	geometry?: object;
}

export class RoutesListResponseDto {
	@ApiProperty({ type: [RouteResponseDto] })
	routes: RouteResponseDto[];

	@ApiProperty({ example: 15 })
	count: number;
}

// ============================================================================
// Trip Response DTOs
// ============================================================================

export class TripResponseDto {
	@ApiProperty({ example: 'TRIP-101-0900' })
	tripId: string;

	@ApiProperty({ example: 'RT-101' })
	routeId: string;

	@ApiProperty({ example: 'Tema Station' })
	tripHeadsign: string;

	@ApiProperty({ example: 'WEEKDAY' })
	serviceId: string;

	@ApiPropertyOptional({ example: 'BLOCK-A' })
	blockId?: string;

	@ApiProperty({ example: 0 })
	directionId: number;

	@ApiProperty({ example: 40 })
	capacity: number;

	@ApiProperty({ example: 25 })
	availableSeats: number;

	@ApiProperty({ example: true })
	isActive: boolean;

	@ApiPropertyOptional({ example: 0 })
	delaySeconds?: number;

	@ApiPropertyOptional({ example: 'VEH-001' })
	vehicleId?: string;
}

export class TripWithStopsResponseDto extends TripResponseDto {
	@ApiProperty({ type: [Object] })
	stopTimes: {
		stopId: string;
		stopName: string;
		arrivalTime: string;
		departureTime: string;
		stopSequence: number;
	}[];
}

export class TripsListResponseDto {
	@ApiProperty({ type: [TripResponseDto] })
	trips: TripResponseDto[];

	@ApiProperty({ example: 20 })
	count: number;

	@ApiPropertyOptional({ description: 'Applied filters' })
	filters?: object;
}

// ============================================================================
// Schedule Response DTOs
// ============================================================================

export class ScheduleItemDto {
	@ApiProperty({ example: 'TRIP-101-0900' })
	tripId: string;

	@ApiProperty({ example: 'RT-101' })
	routeId: string;

	@ApiProperty({ example: '101' })
	routeShortName: string;

	@ApiProperty({ example: 'Tema Station' })
	headsign: string;

	@ApiProperty({ example: '09:30:00' })
	arrivalTime: string;

	@ApiProperty({ example: '09:31:00' })
	departureTime: string;

	@ApiProperty({ example: 25 })
	availableSeats: number;

	@ApiPropertyOptional({ example: 0 })
	delaySeconds?: number;

	@ApiPropertyOptional({ example: 85 })
	vehicleBatteryPercent?: number;

	@ApiProperty({ example: '00FF00' })
	routeColor: string;
}

export class ScheduleResponseDto {
	@ApiProperty({ example: 'STOP-001' })
	stopId: string;

	@ApiProperty({ example: 'Accra Central Station' })
	stopName: string;

	@ApiProperty({ example: '2026-01-15' })
	date: string;

	@ApiProperty({ type: [ScheduleItemDto] })
	departures: ScheduleItemDto[];

	@ApiProperty({ example: 15 })
	count: number;
}

// ============================================================================
// Availability Response DTOs
// ============================================================================

export class SegmentAvailabilityDto {
	@ApiProperty({ example: 'STOP-001' })
	fromStopId: string;

	@ApiProperty({ example: 'Accra Central' })
	fromStopName: string;

	@ApiProperty({ example: 'STOP-002' })
	toStopId: string;

	@ApiProperty({ example: 'Kinbu Gardens' })
	toStopName: string;

	@ApiProperty({ example: 25 })
	availableSeats: number;

	@ApiProperty({ example: 2.5 })
	distanceKm: number;

	@ApiProperty({ example: 1.25 })
	segmentFare: number;
}

export class AvailabilityResponseDto {
	@ApiProperty({ example: 'TRIP-101-0900' })
	tripId: string;

	@ApiProperty({ example: 'STOP-001' })
	fromStopId: string;

	@ApiProperty({ example: 'STOP-005' })
	toStopId: string;

	@ApiProperty({ example: true })
	isAvailable: boolean;

	@ApiProperty({ description: 'Minimum seats available across all segments', example: 15 })
	minAvailableSeats: number;

	@ApiProperty({ example: 7.5 })
	totalDistanceKm: number;

	@ApiProperty({ example: 8.75 })
	totalFare: number;

	@ApiProperty({ description: 'Breakdown by segment', type: [SegmentAvailabilityDto] })
	segments: SegmentAvailabilityDto[];
}

// ============================================================================
// Sync Response DTOs
// ============================================================================

export class SyncChangesDto {
	@ApiProperty({ description: 'Items to update', type: [Object] })
	update: object[];

	@ApiProperty({ description: 'Item IDs to delete', type: [String] })
	delete: string[];
}

export class SyncResponseDto {
	@ApiProperty({ example: 106 })
	version: number;

	@ApiProperty({ example: 'delta' })
	type: 'snapshot' | 'delta';

	@ApiPropertyOptional({
		description: 'Changes per entity (for delta sync)',
		example: {
			stops: { update: [], delete: [] },
			routes: { update: [], delete: [] },
		},
	})
	changes?: {
		stops?: SyncChangesDto;
		routes?: SyncChangesDto;
		trips?: SyncChangesDto;
		stopTimes?: SyncChangesDto;
		calendar?: SyncChangesDto;
	};

	@ApiPropertyOptional({
		description: 'Full data snapshot (for full sync)',
	})
	data?: {
		stops?: object[];
		routes?: object[];
		trips?: object[];
		stopTimes?: object[];
		calendar?: object[];
	};

	@ApiProperty({ example: '2026-01-10T12:00:00Z' })
	generatedAt: string;
}
