// ============================================================================
// Telematics Response DTOs
// ============================================================================
// Response schemas for Swagger documentation

import { ApiProperty } from '@nestjs/swagger';

export class LocationResponseDto {
  @ApiProperty({ example: 'VEH-001', description: 'Vehicle identifier' })
  vehicleId: string;

  @ApiProperty({ example: 5.6037, description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ example: -0.187, description: 'Longitude coordinate' })
  longitude: number;

  @ApiProperty({ example: 45, description: 'Speed in km/h', required: false })
  speed?: number;

  @ApiProperty({ example: 180, description: 'Heading in degrees', required: false })
  heading?: number;

  @ApiProperty({ example: '2024-11-14T16:30:00Z', description: 'Timestamp' })
  timestamp: string;
}

export class LocationUpdateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Location updated successfully' })
  message: string;

  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ example: '2024-11-14T16:30:00Z' })
  timestamp: Date;
}

export class DiagnosticsResponseDto {
  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ example: 85, description: 'Battery level percentage' })
  batteryLevel: number;

  @ApiProperty({ example: 'EXCELLENT', enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] })
  batteryHealth: string;

  @ApiProperty({ example: 45, description: 'Current speed in km/h' })
  speed: number;

  @ApiProperty({ example: 12500, description: 'Total kilometers driven' })
  odometer: number;

  @ApiProperty({ example: 70, description: 'Motor temperature in Celsius' })
  motorTemperature: number;

  @ApiProperty({ example: 35, description: 'Battery temperature in Celsius' })
  batteryTemperature: number;

  @ApiProperty({ example: 'NORMAL', enum: ['NORMAL', 'LOW', 'CRITICAL'] })
  tirePressure: string;

  @ApiProperty({ example: [], description: 'List of active alerts', type: [String] })
  alerts: string[];

  @ApiProperty({ example: '2024-11-14T16:30:00Z' })
  timestamp: Date;
}

export class AlertsResponseDto {
  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ 
    example: ['LOW_BATTERY', 'HIGH_TEMPERATURE'], 
    description: 'List of active alerts',
    type: [String] 
  })
  alerts: string[];

  @ApiProperty({ example: 2 })
  count: number;

  @ApiProperty({ example: '2024-11-14T16:30:00Z' })
  timestamp: Date;
}

export class GeofenceCheckRequestDto {
  @ApiProperty({ example: 'VEH-001', description: 'Vehicle ID to check' })
  vehicleId: string;

  @ApiProperty({ example: 5.6037, description: 'Center latitude of geofence' })
  centerLatitude: number;

  @ApiProperty({ example: -0.187, description: 'Center longitude of geofence' })
  centerLongitude: number;

  @ApiProperty({ example: 1000, description: 'Radius in meters' })
  radiusMeters: number;
}

export class GeofenceCheckResponseDto {
  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ example: true, description: 'Whether vehicle is within geofence' })
  inGeofence: boolean;

  @ApiProperty({ example: 245.8, description: 'Distance from center in meters' })
  distance: number;

  @ApiProperty({ example: '2024-11-14T16:30:00Z' })
  timestamp: Date;
}

export class TripDataResponseDto {
  @ApiProperty({ example: 'TRIP-001' })
  tripId: string;

  @ApiProperty({ example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ example: '2024-11-14T10:00:00Z' })
  startTime: string;

  @ApiProperty({ example: '2024-11-14T12:30:00Z', required: false })
  endTime?: string;

  @ApiProperty({ example: 45.2, description: 'Distance in kilometers' })
  distance: number;

  @ApiProperty({ example: 42.5, description: 'Average speed in km/h' })
  averageSpeed: number;

  @ApiProperty({ example: 'COMPLETED', enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  status: string;
}

export class DriverAnalyticsResponseDto {
  @ApiProperty({ description: 'Unique driver identifier', example: 'DRV-001' })
  driverId: string;

  @ApiProperty({ description: 'Total number of trips completed', example: 25 })
  totalTrips: number;

  @ApiProperty({ description: 'Total distance covered in kilometers', example: 543.2 })
  totalDistance: number;

  @ApiProperty({ description: 'Average speed across all trips in km/h', example: 45.3 })
  averageSpeed: number;

  @ApiProperty({ description: 'Safety score (e.g., 0-100)', example: 92 })
  safetyScore: number;

  @ApiProperty({ description: 'Efficiency score (e.g., 0-100)', example: 88 })
  efficiencyScore: number;
}

export class NearbyVehicleResponseDto {
  @ApiProperty({ description: 'Unique vehicle identifier', example: 'VEH-001' })
  vehicleId: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 5.6037 })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate', example: -0.187 })
  longitude: number;

  @ApiProperty({ description: 'Vehicle speed in km/h', example: 45 })
  speed: number;

  @ApiProperty({ description: 'Vehicle heading in degrees', example: 180 })
  heading: number;

  @ApiProperty({ description: 'GPS accuracy in meters', example: 5.2 })
  accuracy: number;

  @ApiProperty({ description: 'Timestamp of the latest location update', example: '2024-11-14T16:30:00Z' })
  latest_time: Date;
}
