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
  @ApiProperty({ example: 'DRV-001' })
  driverId: string;

  @ApiProperty({ example: 850.5, description: 'Total kilometers driven' })
  totalDistance: number;

  @ApiProperty({ example: 42, description: 'Total trips completed' })
  totalTrips: number;

  @ApiProperty({ example: 45.2, description: 'Average speed in km/h' })
  averageSpeed: number;

  @ApiProperty({ example: 92.5, description: 'Driver score out of 100' })
  driverScore: number;

  @ApiProperty({ example: 3, description: 'Number of harsh braking events' })
  harshBraking: number;

  @ApiProperty({ example: 2, description: 'Number of rapid acceleration events' })
  rapidAcceleration: number;

  @ApiProperty({ example: 1, description: 'Number of speeding incidents' })
  speeding: number;
}
