// ============================================================================
// Telematics Service
// ============================================================================
// Business logic for vehicle tracking, diagnostics, and analytics

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TimestreamService } from './timestream.service';
import { LocationUpdateDto } from '../dto/location-update.dto';
import { MqttService } from '../../mqtt/mqtt.service'; // Import MqttService

@Injectable()
export class TelematicsService {
  private readonly logger = new Logger(TelematicsService.name);

  constructor(
    private timestreamService: TimestreamService,
    private mqttService: MqttService, // Inject MqttService
  ) {}

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

    // Publish to MQTT topics
    const payload = {
      vehicleId: data.vehicleId,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed || 0,
        heading: data.heading || 0,
        accuracy: data.accuracy,
      },
      timestamp: new Date(),
    };

    const vehicleTopic = `volteryde/telematics/live/vehicle/${data.vehicleId}/location`;
    const allVehiclesTopic = `volteryde/telematics/live/all/location`;

    await this.mqttService.publish(vehicleTopic, payload);
    await this.mqttService.publish(allVehiclesTopic, payload);
  }

  async broadcastDiagnosticsUpdate(vehicleId: string, diagnostics: any) {
    const payload = {
      vehicleId,
      diagnostics,
      timestamp: new Date(),
    };
    const vehicleTopic = `volteryde/telematics/live/vehicle/${vehicleId}/diagnostics`;
    const allVehiclesTopic = `volteryde/telematics/live/all/diagnostics`;

    await this.mqttService.publish(vehicleTopic, payload);
    await this.mqttService.publish(allVehiclesTopic, payload);
    this.logger.debug(`Diagnostics update broadcast for vehicle ${vehicleId}`);
  }

  async broadcastAlert(vehicleId: string, alert: string, severity: 'LOW' | 'MEDIUM' | 'HIGH') {
    const payload = {
      vehicleId,
      alert,
      severity,
      timestamp: new Date(),
    };
    const vehicleTopic = `volteryde/telematics/live/vehicle/${vehicleId}/alert`;
    const allVehiclesTopic = `volteryde/telematics/live/all/alert`;

    await this.mqttService.publish(vehicleTopic, payload);
    await this.mqttService.publish(allVehiclesTopic, payload);
    this.logger.warn(`Alert broadcast for vehicle ${vehicleId}: ${alert}`);
  }

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

  async getAlerts(vehicleId: string): Promise<string[]> {
    this.logger.log(`Getting alerts for vehicle ${vehicleId}`);

    const diagnostics = await this.timestreamService.getLatestDiagnostics(vehicleId);

    if (!diagnostics) {
      return [];
    }

    return this.calculateAlerts(diagnostics.diagnostics);
  }

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

  async getTripData(tripId: string): Promise<any> {
    this.logger.log(`Getting trip data for trip ${tripId}`);
    // This is a placeholder. In a real application, you would fetch this from a database.
    // You could use the location history to calculate the trip data.
    const now = new Date();
    return {
      tripId,
      vehicleId: 'VEH-001',
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      endTime: now,
      distance: 15.5,
      averageSpeed: 31,
      maxSpeed: 65,
      status: 'COMPLETED',
    };
  }

  async getDriverAnalytics(driverId: string): Promise<any> {
    this.logger.log(`Getting analytics for driver ${driverId}`);
    // This is a placeholder. In a real application, you would aggregate this data.
    return {
      driverId,
      totalTrips: 25,
      totalDistance: 543.2,
      averageSpeed: 45.3,
      safetyScore: 92,
      efficiencyScore: 88,
    };
  }

  private calculateBatteryHealth(
    batteryLevel: number,
  ): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    if (batteryLevel >= 80) return 'EXCELLENT';
    if (batteryLevel >= 60) return 'GOOD';
    if (batteryLevel >= 40) return 'FAIR';
    return 'POOR';
  }

  private calculateTirePressure(diagnostics: any): 'NORMAL' | 'LOW' | 'CRITICAL' {
    // Placeholder logic
    if (diagnostics.tire_pressure && diagnostics.tire_pressure < 30) {
      return 'LOW';
    }
    if (diagnostics.tire_pressure && diagnostics.tire_pressure < 25) {
      return 'CRITICAL';
    }
    return 'NORMAL';
  }

  private calculateAlerts(diagnostics: any): string[] {
    const alerts: string[] = [];

    if (diagnostics.battery_level < 20) {
      alerts.push('LOW_BATTERY');
    }

    if (diagnostics.battery_temp > 45) {
      alerts.push('HIGH_BATTERY_TEMPERATURE');
    }

    if (diagnostics.motor_temp > 80) {
      alerts.push('HIGH_MOTOR_TEMPERATURE');
    }

    if (diagnostics.speed > 100) {
      alerts.push('EXCESSIVE_SPEED');
    }

    return alerts;
  }

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
