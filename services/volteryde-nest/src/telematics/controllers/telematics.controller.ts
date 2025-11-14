// ============================================================================
// Telematics Controller
// ============================================================================
// REST API endpoints for vehicle tracking, diagnostics, and analytics

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TelematicsService } from '../services/telematics.service';
import { LocationUpdateDto } from '../dto/location-update.dto';
import {
  LocationResponseDto,
  LocationUpdateResponseDto,
  DiagnosticsResponseDto,
  AlertsResponseDto,
  GeofenceCheckRequestDto,
  GeofenceCheckResponseDto,
  TripDataResponseDto,
  DriverAnalyticsResponseDto,
} from '../dto/responses.dto';

// TODO: Create JwtAuthGuard
// import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('Telematics')
@Controller('api/v1/telematics')
// @UseGuards(JwtAuthGuard) // Enable when JWT auth is set up
@ApiBearerAuth()
export class TelematicsController {
  constructor(private telematicsService: TelematicsService) {}

  // =========================================================================
  // Endpoint 1: Get current vehicle location
  // =========================================================================
  @Get('location/current/:vehicleId')
  @ApiOperation({ 
    summary: 'Get current vehicle location',
    description: 'Retrieves the most recent GPS location data for a specific vehicle'
  })
  @ApiParam({ name: 'vehicleId', example: 'VEH-001', description: 'Unique vehicle identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current location returned successfully',
    type: LocationResponseDto
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found or no location data' })
  async getCurrentLocation(@Param('vehicleId') vehicleId: string) {
    return await this.telematicsService.getCurrentLocation(vehicleId);
  }

  // =========================================================================
  // Endpoint 2: Get vehicle location history
  // =========================================================================
  @Get('location/history')
  @ApiOperation({ 
    summary: 'Get vehicle location history',
    description: 'Retrieves historical GPS location data for a vehicle within a specified time range'
  })
  @ApiQuery({ name: 'vehicleId', example: 'VEH-001', description: 'Unique vehicle identifier' })
  @ApiQuery({ name: 'startTime', example: '2024-11-14T00:00:00Z', description: 'Start time (ISO 8601)' })
  @ApiQuery({ name: 'endTime', example: '2024-11-14T23:59:59Z', description: 'End time (ISO 8601)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Location history returned successfully',
    type: [LocationResponseDto]
  })
  async getLocationHistory(
    @Query('vehicleId') vehicleId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return await this.telematicsService.getLocationHistory(
      vehicleId,
      new Date(startTime),
      new Date(endTime),
    );
  }

  // =========================================================================
  // Endpoint 3: Update vehicle location (from driver app)
  // =========================================================================
  @Post('location/track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update vehicle location (called by driver app)',
    description: 'Receives and stores real-time GPS location data from the driver mobile app'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Location updated successfully',
    type: LocationUpdateResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  async updateLocation(@Body() data: LocationUpdateDto) {
    await this.telematicsService.updateLocation(data);
    
    // TODO: Broadcast to WebSocket subscribers
    // this.telematicsGateway.broadcastLocationUpdate(data.vehicleId, data);
    
    return {
      success: true,
      message: 'Location updated successfully',
      vehicleId: data.vehicleId,
      timestamp: new Date(),
    };
  }

  // =========================================================================
  // Endpoint 4: Get vehicle diagnostics
  // =========================================================================
  @Get('diagnostics/:vehicleId')
  @ApiOperation({ 
    summary: 'Get vehicle diagnostics (battery, temperature, etc.)',
    description: 'Retrieves current diagnostic data including battery level, temperature, and health status'
  })
  @ApiParam({ name: 'vehicleId', example: 'VEH-001', description: 'Unique vehicle identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Diagnostics returned successfully',
    type: DiagnosticsResponseDto
  })
  @ApiResponse({ status: 404, description: 'No diagnostics data found' })
  async getDiagnostics(@Param('vehicleId') vehicleId: string) {
    return await this.telematicsService.getDiagnostics(vehicleId);
  }

  // =========================================================================
  // Endpoint 5: Get vehicle alerts
  // =========================================================================
  @Get('alerts/:vehicleId')
  @ApiOperation({ 
    summary: 'Get vehicle alerts and warnings',
    description: 'Retrieves all active alerts for a vehicle (low battery, high temperature, etc.)'
  })
  @ApiParam({ name: 'vehicleId', example: 'VEH-001', description: 'Unique vehicle identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerts returned successfully',
    type: AlertsResponseDto
  })
  async getAlerts(@Param('vehicleId') vehicleId: string) {
    const alerts = await this.telematicsService.getAlerts(vehicleId);
    
    return {
      vehicleId,
      alerts,
      count: alerts.length,
      timestamp: new Date(),
    };
  }

  // =========================================================================
  // Endpoint 6: Check if vehicle is within geofence
  // =========================================================================
  @Post('geofence/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Check if vehicle is within a geofence',
    description: 'Calculates if a vehicle is currently within a circular geofence area'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Geofence check completed',
    type: GeofenceCheckResponseDto
  })
  async checkGeofence(
    @Body() data: GeofenceCheckRequestDto,
  ) {
    const result = await this.telematicsService.checkGeofence(
      data.vehicleId,
      data.centerLatitude,
      data.centerLongitude,
      data.radiusMeters,
    );

    return {
      vehicleId: data.vehicleId,
      ...result,
      timestamp: new Date(),
    };
  }

  // =========================================================================
  // Endpoint 7: Get trip data
  // =========================================================================
  @Get('trip/:tripId')
  @ApiOperation({ 
    summary: 'Get trip data (route, stats, etc.)',
    description: 'Retrieves complete trip information including route, distance, and performance metrics'
  })
  @ApiParam({ name: 'tripId', example: 'TRIP-001', description: 'Unique trip identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trip data returned successfully',
    type: TripDataResponseDto
  })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async getTripData(@Param('tripId') tripId: string) {
    return await this.telematicsService.getTripData(tripId);
  }

  // =========================================================================
  // Endpoint 8: Get driver behavior analytics
  // =========================================================================
  @Get('analytics/driver/:driverId')
  @ApiOperation({ 
    summary: 'Get driver behavior analytics and scores',
    description: 'Retrieves comprehensive driver performance metrics including safety scores and driving patterns'
  })
  @ApiParam({ name: 'driverId', example: 'DRV-001', description: 'Unique driver identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Driver analytics returned successfully',
    type: DriverAnalyticsResponseDto
  })
  async getDriverAnalytics(@Param('driverId') driverId: string) {
    return await this.telematicsService.getDriverAnalytics(driverId);
  }
}
