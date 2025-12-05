// ============================================================================
// Telematics Service
// ============================================================================
// Business logic for vehicle tracking, diagnostics, and analytics

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TimestreamService } from './timestream.service';
import { LocationUpdateDto } from '../dto/location-update.dto';
import { MqttService } from '../../mqtt/mqtt.service'; // Import MqttService
import { NotificationService } from '../../booking/services/notification.service'; // Import NotificationService

import * as ngeohash from 'ngeohash'; // Import ngeohash

@Injectable()
export class TelematicsService {
  private readonly logger = new Logger(TelematicsService.name);
  private readonly MAX_ALLOWED_SPEED_KPH = 150; // Example: Max speed for a bus
  private readonly MAX_ACCURACY_THRESHOLD_METERS = 50; // Example: Max acceptable GPS accuracy
  // Expected GPS update frequency from mobile apps: 1-5 seconds.
  // Server-side logic is designed to handle this frequency.

  constructor(
    private timestreamService: TimestreamService,
    private mqttService: MqttService, // Inject MqttService
    private notificationService: NotificationService, // Inject NotificationService
  ) { }

  async updateLocation(data: LocationUpdateDto): Promise<void> {
    this.logger.log(`Updating location for vehicle ${data.vehicleId}`);

    // Perform fraud detection
    const fraudReason = await this.detectFraud(data);
    if (fraudReason) {
      this.logger.warn(`FRAUD DETECTED for vehicle ${data.vehicleId}: ${fraudReason}. Location update ignored.`);
      // Send internal notification to administrators
      await this.notificationService.sendNotification({
        userId: 'admin', // Or a specific admin user ID
        type: 'EMAIL', // Or PUSH to an admin app
        subject: `Fraud Alert: Vehicle ${data.vehicleId}`,
        message: `Fraudulent activity detected for vehicle ${data.vehicleId}. Reason: ${fraudReason}.`,
      });
      // TODO: Integrate with a dedicated fraud alerting system or driver management system
      // For example, update driver's fraud score or temporarily suspend driver.
      return; // Stop processing this fraudulent update
    }

    // Generate Geohash
    const geohash = ngeohash.encode(data.latitude, data.longitude, 9); // Precision 9 (approx 4.77m x 4.77m)

    await this.timestreamService.writeLocation({
      vehicleId: data.vehicleId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      geohash: geohash, // Pass geohash to TimestreamService
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
      geohash: geohash, // Include geohash in MQTT payload
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

  async findNearbyVehicles(
    latitude: number,
    longitude: number,
    precision: number = 6,
    timeWindowMinutes: number = 5,
  ): Promise<any[]> {
    this.logger.log(`Finding nearby vehicles at (${latitude}, ${longitude})`);
    return await this.timestreamService.findNearbyVehicles(
      latitude,
      longitude,
      precision,
      timeWindowMinutes,
    );
  }

  private async detectFraud(data: LocationUpdateDto): Promise<boolean> {
    // Rule 1: Check for client-side mock location flag
    if (data.isMocked) {
      this.logger.warn(`Fraud detected: Client-side mock location flag set for vehicle ${data.vehicleId}`);
      return true;
    }

    // Rule 2: Check GPS accuracy
    if (data.accuracy && data.accuracy > this.MAX_ACCURACY_THRESHOLD_METERS) {
      this.logger.warn(`Fraud detected: Low GPS accuracy (${data.accuracy}m) for vehicle ${data.vehicleId}`);
      return true;
    }

    // Rule 3: Impossible speed/distance check
    const lastLocation = await this.timestreamService.getLatestLocation(data.vehicleId);

    if (lastLocation && lastLocation.location && lastLocation.time) {
      const lastLat = lastLocation.location.latitude;
      const lastLng = lastLocation.location.longitude;
      const lastTimestamp = new Date(lastLocation.time);
      const currentTimestamp = data.timestamp || new Date();

      const timeDiffSeconds = (currentTimestamp.getTime() - lastTimestamp.getTime()) / 1000;
      const distanceMeters = this.calculateDistance(lastLat, lastLng, data.latitude, data.longitude);

      if (timeDiffSeconds > 0) {
        const speedMps = distanceMeters / timeDiffSeconds;
        const speedKph = speedMps * 3.6; // Convert m/s to km/h

        if (speedKph > this.MAX_ALLOWED_SPEED_KPH) {
          this.logger.warn(
            `Fraud detected: Impossible speed (${speedKph.toFixed(2)} km/h) for vehicle ${data.vehicleId}. ` +
            `Moved ${distanceMeters.toFixed(2)}m in ${timeDiffSeconds.toFixed(2)}s.`
          );
          return true;
        }
      }
    }

    return false; // No fraud detected
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
