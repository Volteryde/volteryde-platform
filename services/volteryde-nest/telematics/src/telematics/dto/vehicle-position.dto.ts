// ============================================================================
// Vehicle Position Response DTOs
// ============================================================================
// GTFS-RT Compatible response DTOs with EV battery extensions
// Reference: https://gtfs.org/documentation/realtime/reference/

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OccupancyStatus, ChargingState } from './location-update.dto';

// ============================================================================
// GTFS-RT Compatible Vehicle Position
// ============================================================================

export class VehiclePositionDto {
	@ApiProperty({ description: 'Vehicle ID', example: 'VEH-001' })
	vehicleId: string;

	@ApiProperty({ description: 'Latitude', example: 5.6037 })
	latitude: number;

	@ApiProperty({ description: 'Longitude', example: -0.187 })
	longitude: number;

	@ApiPropertyOptional({ description: 'Bearing/heading in degrees', example: 180 })
	bearing?: number;

	@ApiPropertyOptional({ description: 'Speed in m/s', example: 12.5 })
	speed?: number;

	@ApiProperty({ description: 'Timestamp of position', example: '2026-01-10T12:00:00Z' })
	timestamp: string;

	@ApiPropertyOptional({ description: 'Odometer reading in meters', example: 45230500 })
	odometer?: number;

	// GTFS-RT Standard Fields
	@ApiPropertyOptional({ description: 'GTFS trip_id', example: 'TRIP-101-0900' })
	tripId?: string;

	@ApiPropertyOptional({ description: 'GTFS route_id', example: 'RT-101' })
	routeId?: string;

	@ApiPropertyOptional({
		description: 'Current trip status',
		enum: ['INCOMING_AT', 'STOPPED_AT', 'IN_TRANSIT_TO'],
		example: 'IN_TRANSIT_TO',
	})
	currentStatus?: 'INCOMING_AT' | 'STOPPED_AT' | 'IN_TRANSIT_TO';

	@ApiPropertyOptional({ description: 'Current stop ID', example: 'STOP-OSU-003' })
	stopId?: string;

	@ApiPropertyOptional({ description: 'Stop sequence in trip', example: 3 })
	currentStopSequence?: number;

	@ApiPropertyOptional({
		description: 'Congestion level',
		enum: ['UNKNOWN', 'RUNNING_SMOOTHLY', 'STOP_AND_GO', 'CONGESTION', 'SEVERE_CONGESTION'],
		example: 'RUNNING_SMOOTHLY',
	})
	congestionLevel?: string;

	@ApiPropertyOptional({
		description: 'GTFS-RT occupancy status',
		enum: OccupancyStatus,
		example: 'MANY_SEATS_AVAILABLE',
	})
	occupancyStatus?: OccupancyStatus;

	@ApiPropertyOptional({ description: 'Occupancy percentage', example: 37.5 })
	occupancyPercentage?: number;

	// ============================================================================
	// VolteRyde EV Battery Extension (Custom GTFS-RT Extension)
	// ============================================================================

	@ApiPropertyOptional({ description: 'Battery level percentage', example: 75.5 })
	batteryLevelPercent?: number;

	@ApiPropertyOptional({
		description: 'Current charging state',
		enum: ChargingState,
		example: 'NOT_CHARGING',
	})
	chargingState?: ChargingState;

	@ApiPropertyOptional({ description: 'Remaining range in km', example: 180.5 })
	remainingRangeKm?: number;

	@ApiPropertyOptional({ description: 'Energy consumed this trip in kWh', example: 12.5 })
	energyConsumedKwh?: number;
}

// ============================================================================
// Trip Update DTO (GTFS-RT Compatible)
// ============================================================================

export class StopTimeUpdateDto {
	@ApiProperty({ description: 'Stop sequence', example: 3 })
	stopSequence: number;

	@ApiProperty({ description: 'Stop ID', example: 'STOP-OSU-003' })
	stopId: string;

	@ApiPropertyOptional({ description: 'Arrival delay in seconds', example: 120 })
	arrivalDelay?: number;

	@ApiPropertyOptional({ description: 'Departure delay in seconds', example: 150 })
	departureDelay?: number;

	@ApiPropertyOptional({
		description: 'Schedule relationship',
		enum: ['SCHEDULED', 'SKIPPED', 'NO_DATA'],
		example: 'SCHEDULED',
	})
	scheduleRelationship?: 'SCHEDULED' | 'SKIPPED' | 'NO_DATA';
}

export class TripUpdateDto {
	@ApiProperty({ description: 'GTFS trip_id', example: 'TRIP-101-0900' })
	tripId: string;

	@ApiProperty({ description: 'GTFS route_id', example: 'RT-101' })
	routeId: string;

	@ApiPropertyOptional({ description: 'Trip start date (YYYYMMDD)', example: '20260110' })
	startDate?: string;

	@ApiPropertyOptional({ description: 'Trip start time (HH:MM:SS)', example: '09:00:00' })
	startTime?: string;

	@ApiPropertyOptional({
		description: 'Schedule relationship',
		enum: ['SCHEDULED', 'ADDED', 'UNSCHEDULED', 'CANCELED'],
		example: 'SCHEDULED',
	})
	scheduleRelationship?: 'SCHEDULED' | 'ADDED' | 'UNSCHEDULED' | 'CANCELED';

	@ApiPropertyOptional({ description: 'Vehicle ID', example: 'VEH-001' })
	vehicleId?: string;

	@ApiPropertyOptional({ description: 'Overall trip delay in seconds', example: 120 })
	delay?: number;

	@ApiPropertyOptional({ description: 'Stop time updates', type: [StopTimeUpdateDto] })
	stopTimeUpdates?: StopTimeUpdateDto[];

	// ============================================================================
	// VolteRyde EV Extension
	// ============================================================================

	@ApiPropertyOptional({ description: 'Current battery level', example: 75.5 })
	batteryLevelPercent?: number;

	@ApiPropertyOptional({ description: 'Expected battery at end of trip', example: 45.2 })
	expectedBatteryAtEnd?: number;

	@ApiPropertyOptional({ description: 'Can vehicle complete trip with current battery?', example: true })
	canCompleteTrip?: boolean;
}

// ============================================================================
// Fleet Overview Response
// ============================================================================

export class FleetPositionsResponseDto {
	@ApiProperty({ description: 'List of vehicle positions', type: [VehiclePositionDto] })
	vehicles: VehiclePositionDto[];

	@ApiProperty({ description: 'Total vehicles', example: 25 })
	total: number;

	@ApiProperty({ description: 'Vehicles currently on active trips', example: 18 })
	onTrip: number;

	@ApiProperty({ description: 'Vehicles charging', example: 3 })
	charging: number;

	@ApiProperty({ description: 'Vehicles with low battery (<20%)', example: 2 })
	lowBattery: number;

	@ApiProperty({ description: 'Response timestamp', example: '2026-01-10T12:00:00Z' })
	timestamp: string;
}

// ============================================================================
// Battery Alert DTO
// ============================================================================

export enum BatteryAlertType {
	LOW_BATTERY = 'LOW_BATTERY',
	CRITICAL_BATTERY = 'CRITICAL_BATTERY',
	CANNOT_COMPLETE_TRIP = 'CANNOT_COMPLETE_TRIP',
	TEMPERATURE_WARNING = 'TEMPERATURE_WARNING',
	CHARGING_FAULT = 'CHARGING_FAULT',
}

export class BatteryAlertDto {
	@ApiProperty({ description: 'Alert ID', example: 'ALT-001' })
	alertId: string;

	@ApiProperty({ description: 'Vehicle ID', example: 'VEH-001' })
	vehicleId: string;

	@ApiProperty({ description: 'Alert type', enum: BatteryAlertType, example: 'LOW_BATTERY' })
	type: BatteryAlertType;

	@ApiProperty({ description: 'Alert severity', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'HIGH' })
	severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

	@ApiProperty({ description: 'Alert message', example: 'Battery at 15%, consider routing to charging station' })
	message: string;

	@ApiProperty({ description: 'Current battery level', example: 15.0 })
	batteryLevel: number;

	@ApiPropertyOptional({ description: 'Trip ID if on trip', example: 'TRIP-101-0900' })
	tripId?: string;

	@ApiPropertyOptional({ description: 'Nearest charging station', example: 'STOP-TES-005' })
	nearestChargingStation?: string;

	@ApiPropertyOptional({ description: 'Distance to charging station in km', example: 2.5 })
	distanceToStation?: number;

	@ApiProperty({ description: 'Alert timestamp', example: '2026-01-10T12:00:00Z' })
	timestamp: string;
}
