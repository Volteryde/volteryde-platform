// ============================================================================
// Telematics Service
// ============================================================================
// Business logic for vehicle tracking, diagnostics, and analytics

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TimestreamService } from './timestream.service';
import { LocationUpdateDto } from '../dto/location-update.dto';

@Injectable()
export class TelematicsService {
  private readonly logger = new Logger(TelematicsService.name);

  constructor(private timestreamService: TimestreamService) {}

  /**
   * Update vehicle location and broadcast to WebSocket subscribers
   */
  async updateLocation(data: LocationUpdateDto): Promise<void> {
    this.logger.log(`Updating location for vehicle ${data.vehicleId}`);

    await this.timestreamService.writeLocation({
      vehicleId: data.vehicleId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
    });
  }

  /**
   * Get current vehicle location
   */
  async getCurrentLocation(vehicleId: string): Promise<any> {
    this.logger.log(`Getting current location for vehicle ${vehicleId}`);

    const location = await this.timestreamService.getLatestLocation(vehicleId);

    if (!location) {
      throw new NotFoundException(`No location data found for vehicle ${vehicleId}`);
    }

    return {
      vehicleId,
      latitude: location.location?.latitude || 0,
      longitude: location.location?.longitude || 0,
      speed: location.location?.speed || 0,
      heading: location.location?.heading || 0,
      timestamp: location.time,
    };
  }

  /**
   * Get vehicle location history
   */
  async getLocationHistory(
    vehicleId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    this.logger.log(`Getting location history for vehicle ${vehicleId}`);

    const history = await this.timestreamService.queryLocationHistory(
      vehicleId,
      startTime,
      endTime,
    );

    return history.map((record) => ({
      vehicleId: record.vehicleId,
      latitude: parseFloat(record.latitude),
      longitude: parseFloat(record.longitude),
      speed: record.speed ? parseFloat(record.speed) : 0,
      heading: record.heading ? parseFloat(record.heading) : 0,
      timestamp: record.time,
    }));
  }

  /**
   * Get vehicle diagnostics
   */
  async getDiagnostics(vehicleId: string): Promise<any> {
    this.logger.log(`Getting diagnostics for vehicle ${vehicleId}`);

    const data = await this.timestreamService.getLatestDiagnostics(vehicleId);

    if (!data) {
      throw new NotFoundException(`No diagnostics data found for vehicle ${vehicleId}`);
    }

    const diagnostics = data.diagnostics;

    return {
      vehicleId,
      batteryLevel: diagnostics.battery_level,
      batteryHealth: this.calculateBatteryHealth(diagnostics.battery_level),
      speed: diagnostics.speed,
      odometer: diagnostics.odometer,
      motorTemperature: diagnostics.motor_temp,
      batteryTemperature: diagnostics.battery_temp,
      tirePressure: this.calculateTirePressure(diagnostics),
      alerts: this.calculateAlerts(diagnostics),
      timestamp: new Date(data.time),
    };
  }

  /**
   * Get vehicle alerts
   */
  async getAlerts(vehicleId: string): Promise<string[]> {
    this.logger.log(`Getting alerts for vehicle ${vehicleId}`);

    const diagnostics = await this.timestreamService.getLatestDiagnostics(vehicleId);

    if (!diagnostics) {
      return [];
    }

    return this.calculateAlerts(diagnostics.diagnostics);
  }

  /**
   * Check if vehicle is within geofence
   */
  async checkGeofence(
    vehicleId: string,
    centerLat: number,
    centerLng: number,
    radiusMeters: number,
  ): Promise<{ inGeofence: boolean; distance: number }> {
    this.logger.log(`Checking geofence for vehicle ${vehicleId}`);

    const location = await this.timestreamService.getLatestLocation(vehicleId);

    if (!location) {
      throw new NotFoundException(`No location data found for vehicle ${vehicleId}`);
    }

    const vehicleLat = location.location?.latitude || 0;
    const vehicleLng = location.location?.longitude || 0;

    const distance = this.calculateDistance(
      vehicleLat,
      vehicleLng,
      centerLat,
      centerLng,
    );

    return {
      inGeofence: distance <= radiusMeters,
      distance: Math.round(distance),
    };
  }

  /**
   * Get trip data (placeholder - implement with trip tracking)
   */
  async getTripData(tripId: string): Promise<any> {
    this.logger.log(`Getting trip data for trip ${tripId}`);

    // TODO: Implement trip tracking in Timestream
    // For now, return placeholder
    return {
      tripId,
      vehicleId: 'VEH-001',
      startTime: new Date(),
      endTime: null,
      distance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      status: 'IN_PROGRESS',
    };
  }

  /**
   * Get driver analytics (placeholder - implement with analytics aggregation)
   */
  async getDriverAnalytics(driverId: string): Promise<any> {
    this.logger.log(`Getting analytics for driver ${driverId}`);

    // TODO: Implement driver analytics aggregation
    return {
      driverId,
      totalTrips: 0,
      totalDistance: 0,
      averageSpeed: 0,
      safetyScore: 100,
      efficiencyScore: 100,
    };
  }

  /**
   * Calculate battery health based on battery level
   */
  private calculateBatteryHealth(
    batteryLevel: number,
  ): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    if (batteryLevel >= 80) return 'EXCELLENT';
    if (batteryLevel >= 60) return 'GOOD';
    if (batteryLevel >= 40) return 'FAIR';
    return 'POOR';
  }

  /**
   * Calculate tire pressure status
   */
  private calculateTirePressure(diagnostics: any): 'NORMAL' | 'LOW' | 'CRITICAL' {
    // TODO: Implement actual tire pressure monitoring
    // For now, return NORMAL
    return 'NORMAL';
  }

  /**
   * Calculate active alerts based on diagnostics
   */
  private calculateAlerts(diagnostics: any): string[] {
    const alerts: string[] = [];

    // Battery alerts
    if (diagnostics.battery_level < 20) {
      alerts.push('LOW_BATTERY');
    }

    // Temperature alerts
    if (diagnostics.battery_temp > 45) {
      alerts.push('HIGH_BATTERY_TEMPERATURE');
    }

    if (diagnostics.motor_temp > 80) {
      alerts.push('HIGH_MOTOR_TEMPERATURE');
    }

    // Speed alerts (if speed data available in diagnostics)
    if (diagnostics.speed > 100) {
      alerts.push('EXCESSIVE_SPEED');
    }

    return alerts;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
