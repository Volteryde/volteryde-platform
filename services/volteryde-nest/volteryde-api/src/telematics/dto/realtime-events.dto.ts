// ============================================================================
// Real-Time Event DTOs
// ============================================================================
// DTOs for WebSocket events between client and server

import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';

// ============================================================================
// Bus Location Events
// ============================================================================

export class BusLocationDto {
	@IsString()
	busId: string;

	@IsNumber()
	latitude: number;

	@IsNumber()
	longitude: number;

	@IsNumber()
	@IsOptional()
	heading?: number;

	@IsNumber()
	@IsOptional()
	speed?: number;

	@IsNumber()
	timestamp: number;

	@IsNumber()
	@IsOptional()
	accuracy?: number;
}

// ============================================================================
// Bus Status Events
// ============================================================================

export enum BusOperationalStatus {
	IDLE = 'IDLE',
	EN_ROUTE = 'EN_ROUTE',
	AT_STOP = 'AT_STOP',
	BOARDING = 'BOARDING',
	IN_SERVICE = 'IN_SERVICE',
	OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export class BusStatusDto {
	@IsString()
	busId: string;

	@IsEnum(BusOperationalStatus)
	status: BusOperationalStatus;

	@IsNumber()
	@IsOptional()
	eta?: number; // ETA in minutes

	@IsString()
	@IsOptional()
	currentStopId?: string;

	@IsString()
	@IsOptional()
	nextStopId?: string;

	@IsNumber()
	@IsOptional()
	occupancy?: number;

	@IsNumber()
	timestamp: number;
}

// ============================================================================
// Booking State Events
// ============================================================================

export enum BookingTripState {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	BUS_ASSIGNED = 'BUS_ASSIGNED',
	EN_ROUTE = 'EN_ROUTE',
	ARRIVING = 'ARRIVING',
	ARRIVED = 'ARRIVED',
	BOARDING = 'BOARDING',
	IN_PROGRESS = 'IN_PROGRESS',
	APPROACHING_DESTINATION = 'APPROACHING_DESTINATION',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
	NO_SHOW = 'NO_SHOW',
}

export class BookingStateDto {
	@IsString()
	bookingId: string;

	@IsEnum(BookingTripState)
	state: BookingTripState;

	@IsNumber()
	@IsOptional()
	eta?: number; // ETA in minutes

	@IsString()
	@IsOptional()
	busId?: string;

	@IsString()
	@IsOptional()
	driverName?: string;

	@IsString()
	@IsOptional()
	busPlate?: string;

	@IsNumber()
	@IsOptional()
	sequenceNumber?: number; // For ordering out-of-order events

	@IsNumber()
	timestamp: number;
}

// ============================================================================
// Route Update Events
// ============================================================================

export class RouteUpdateDto {
	@IsString()
	bookingId: string;

	@IsString()
	polyline: string; // Encoded polyline

	@IsNumber()
	@IsOptional()
	distanceMeters?: number;

	@IsNumber()
	@IsOptional()
	durationMinutes?: number;

	@IsNumber()
	timestamp: number;
}

// ============================================================================
// Fare Update Events
// ============================================================================

export class FareUpdateDto {
	@IsString()
	bookingId: string;

	@IsNumber()
	fare: number;

	@IsString()
	currency: string;

	@IsString()
	@IsOptional()
	reason?: string; // e.g., 'surge_pricing', 'route_change'

	@IsNumber()
	timestamp: number;
}

// ============================================================================
// Subscription Events (Client -> Server)
// ============================================================================

export class SubscribeBookingDto {
	@IsString()
	bookingId: string;
}

export class SubscribeBusDto {
	@IsString()
	busId: string;
}

export class SubscribeRouteDto {
	@IsString()
	routeId: string;
}

export class UnsubscribeDto {
	@IsString()
	room: string;
}

// ============================================================================
// Connection Events
// ============================================================================

export class ConnectionAckDto {
	@IsBoolean()
	success: boolean;

	@IsString()
	@IsOptional()
	userId?: string;

	@IsString()
	@IsOptional()
	message?: string;

	@IsNumber()
	timestamp: number;
}

export class ErrorDto {
	@IsString()
	code: string;

	@IsString()
	message: string;

	@IsNumber()
	timestamp: number;
}
