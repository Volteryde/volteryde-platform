// ============================================================================
// Telematics Service
// ============================================================================
// Business logic for vehicle tracking, diagnostics, and analytics
// Enhanced with EV battery monitoring and GTFS trip linking

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TimestreamService } from './timestream.service';
import { LocationUpdateDto, ChargingState } from '../dto/location-update.dto';
import {
  VehiclePositionDto,
  BatteryAlertDto,
  BatteryAlertType,
} from '../dto/vehicle-position.dto';
import * as ngeohash from 'ngeohash';

@Injectable()
export class TelematicsService {
  private readonly logger = new Logger(TelematicsService.name);
  private readonly MAX_ALLOWED_SPEED_KPH = 150;
  private readonly MAX_ACCURACY_THRESHOLD_METERS = 50;

  // EV Battery Thresholds
  private readonly LOW_BATTERY_THRESHOLD = 20;
  private readonly CRITICAL_BATTERY_THRESHOLD = 10;
  private readonly HIGH_BATTERY_TEMP_THRESHOLD = 45; // Celsius
  private readonly MIN_BATTERY_FOR_TRIP_START = 30; // Minimum % to start a new trip

  // In-memory cache for active vehicles (would be Redis in production)
  private vehiclePositions: Map<string, VehiclePositionDto> = new Map();
  private batteryAlerts: Map<string, BatteryAlertDto[]> = new Map();

  constructor(
    private timestreamService: TimestreamService,
  ) { }

  async updateLocation(data: LocationUpdateDto): Promise<void> {
    this.logger.log(`Updating location for vehicle ${data.vehicleId}`);

    // Perform fraud detection
    const fraudReason = await this.detectFraud(data);
    if (fraudReason) {
      this.logger.warn(`FRAUD DETECTED for vehicle ${data.vehicleId}: ${fraudReason}. Location update ignored.`);
      return;
    }

    // Generate Geohash
    const geohash = ngeohash.encode(data.latitude, data.longitude, 9);

    // Process EV battery data
    if (data.batteryLevelPercent !== undefined) {
      await this.processBatteryTelemetry(data);
    }

    // Write location to time-series database (core fields only)
    await this.timestreamService.writeLocation({
      vehicleId: data.vehicleId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      geohash: geohash,
    });

    // Log EV data separately (would use Timestream multi-measure in production)
    if (data.batteryLevelPercent !== undefined) {
      this.logger.debug(
        `Vehicle ${data.vehicleId} battery: ${data.batteryLevelPercent}%, ` +
        `range: ${data.remainingRangeKm}km, trip: ${data.tripId || 'none'}`
      );
    }

    // Update in-memory position cache
    this.updateVehiclePositionCache(data);
  }

  // ============================================================================
  // EV Battery Monitoring
  // ============================================================================

  private async processBatteryTelemetry(data: LocationUpdateDto): Promise<void> {
    const batteryLevel = data.batteryLevelPercent!;
    const vehicleId = data.vehicleId;

    // Check for low battery
    if (batteryLevel <= this.CRITICAL_BATTERY_THRESHOLD) {
      await this.createBatteryAlert(vehicleId, BatteryAlertType.CRITICAL_BATTERY, 'CRITICAL', batteryLevel, data.tripId);
    } else if (batteryLevel <= this.LOW_BATTERY_THRESHOLD) {
      await this.createBatteryAlert(vehicleId, BatteryAlertType.LOW_BATTERY, 'HIGH', batteryLevel, data.tripId);
    }

    // Check battery temperature
    if (data.batteryTemperature && data.batteryTemperature > this.HIGH_BATTERY_TEMP_THRESHOLD) {
      await this.createBatteryAlert(vehicleId, BatteryAlertType.TEMPERATURE_WARNING, 'MEDIUM', batteryLevel, data.tripId);
    }

    // Check if vehicle can complete current trip
    if (data.tripId && data.remainingRangeKm !== undefined) {
      const canComplete = await this.canCompleteTripWithCurrentBattery(data);
      if (!canComplete) {
        await this.createBatteryAlert(vehicleId, BatteryAlertType.CANNOT_COMPLETE_TRIP, 'CRITICAL', batteryLevel, data.tripId);
      }
    }
  }

  private async createBatteryAlert(
    vehicleId: string,
    type: BatteryAlertType,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    batteryLevel: number,
    tripId?: string,
  ): Promise<void> {
    const alert: BatteryAlertDto = {
      alertId: `ALT-${Date.now()}`,
      vehicleId,
      type,
      severity,
      message: this.getBatteryAlertMessage(type, batteryLevel),
      batteryLevel,
      tripId,
      timestamp: new Date().toISOString(),
    };

    // Store alert
    if (!this.batteryAlerts.has(vehicleId)) {
      this.batteryAlerts.set(vehicleId, []);
    }
    this.batteryAlerts.get(vehicleId)!.push(alert);

    // Broadcast alert
    this.broadcastAlert(vehicleId, alert.message, severity);

    this.logger.warn(`Battery alert for ${vehicleId}: ${alert.message}`);
  }

  private getBatteryAlertMessage(type: BatteryAlertType, batteryLevel: number): string {
    switch (type) {
      case BatteryAlertType.CRITICAL_BATTERY:
        return `CRITICAL: Battery at ${batteryLevel}%. Immediate charging required.`;
      case BatteryAlertType.LOW_BATTERY:
        return `Battery at ${batteryLevel}%. Consider routing to charging station.`;
      case BatteryAlertType.CANNOT_COMPLETE_TRIP:
        return `Insufficient battery (${batteryLevel}%) to complete current trip. Route to charging station.`;
      case BatteryAlertType.TEMPERATURE_WARNING:
        return `Battery temperature warning. Current level: ${batteryLevel}%.`;
      case BatteryAlertType.CHARGING_FAULT:
        return `Charging fault detected. Battery at ${batteryLevel}%.`;
      default:
        return `Battery alert: ${batteryLevel}%`;
    }
  }

  async canCompleteTripWithCurrentBattery(data: LocationUpdateDto): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Query GTFS for remaining trip distance
    // 2. Calculate required energy based on vehicle efficiency
    // 3. Compare with remaining range

    if (!data.remainingRangeKm || !data.tripId) {
      return true; // Can't determine, assume ok
    }

    // Placeholder: assume average trip remaining is 15km with 20% safety margin
    const estimatedRemainingTripKm = 15;
    const safetyMargin = 1.2;

    return data.remainingRangeKm >= (estimatedRemainingTripKm * safetyMargin);
  }

  async validateBatteryForTripAssignment(vehicleId: string, tripDistanceKm: number): Promise<{
    canAssign: boolean;
    reason?: string;
    currentBattery?: number;
    requiredBattery?: number;
  }> {
    const position = this.vehiclePositions.get(vehicleId);

    if (!position || position.batteryLevelPercent === undefined) {
      return { canAssign: false, reason: 'No battery data available' };
    }

    const currentBattery = position.batteryLevelPercent;

    // Simple calculation: assume 0.3 kWh/km and 60 kWh battery
    const energyRequired = tripDistanceKm * 0.3;
    const totalCapacity = 60; // kWh
    const requiredBattery = (energyRequired / totalCapacity) * 100 * 1.2; // 20% safety margin

    if (currentBattery < this.MIN_BATTERY_FOR_TRIP_START) {
      return {
        canAssign: false,
        reason: `Battery (${currentBattery}%) below minimum threshold (${this.MIN_BATTERY_FOR_TRIP_START}%)`,
        currentBattery,
        requiredBattery,
      };
    }

    if (currentBattery < requiredBattery) {
      return {
        canAssign: false,
        reason: `Insufficient battery for ${tripDistanceKm}km trip`,
        currentBattery,
        requiredBattery: Math.ceil(requiredBattery),
      };
    }

    return { canAssign: true, currentBattery };
  }

  private updateVehiclePositionCache(data: LocationUpdateDto): void {
    const position: VehiclePositionDto = {
      vehicleId: data.vehicleId,
      latitude: data.latitude,
      longitude: data.longitude,
      bearing: data.heading,
      speed: data.speed ? data.speed / 3.6 : undefined, // km/h to m/s
      timestamp: (data.timestamp || new Date()).toISOString(),
      tripId: data.tripId,
      stopId: data.currentStopId,
      currentStopSequence: data.currentStopSequence,
      occupancyStatus: data.occupancyStatus,
      batteryLevelPercent: data.batteryLevelPercent,
      chargingState: data.chargingState,
      remainingRangeKm: data.remainingRangeKm,
      energyConsumedKwh: data.energyConsumedKwh,
    };
    this.vehiclePositions.set(data.vehicleId, position);
  }

  // ============================================================================
  // Fleet Position Queries
  // ============================================================================

  async getFleetPositions(): Promise<{
    vehicles: VehiclePositionDto[];
    total: number;
    onTrip: number;
    charging: number;
    lowBattery: number;
  }> {
    const vehicles = Array.from(this.vehiclePositions.values());

    return {
      vehicles,
      total: vehicles.length,
      onTrip: vehicles.filter(v => v.tripId).length,
      charging: vehicles.filter(v => v.chargingState === ChargingState.CHARGING).length,
      lowBattery: vehicles.filter(v => (v.batteryLevelPercent || 100) < this.LOW_BATTERY_THRESHOLD).length,
    };
  }

  async getVehicleBatteryAlerts(vehicleId: string): Promise<BatteryAlertDto[]> {
    return this.batteryAlerts.get(vehicleId) || [];
  }


  async broadcastAlert(vehicleId: string, alert: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') {
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
