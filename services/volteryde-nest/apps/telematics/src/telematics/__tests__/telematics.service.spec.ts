// ============================================================================
// Telematics Service Unit Tests
// ============================================================================
// Testing business logic for vehicle tracking and diagnostics

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TelematicsService } from '../services/telematics.service';
import { TimestreamService } from '../services/timestream.service';
import { LocationUpdateDto } from '../dto/location-update.dto';

describe('TelematicsService', () => {
  let service: TelematicsService;
  let timestreamService: TimestreamService;

  // Mock Timestream Service
  const mockTimestreamService = {
    writeLocation: jest.fn(),
    writeDiagnostics: jest.fn(),
    getLatestLocation: jest.fn(),
    queryLocationHistory: jest.fn(),
    getLatestDiagnostics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelematicsService,
        {
          provide: TimestreamService,
          useValue: mockTimestreamService,
        },
      ],
    }).compile();

    service = module.get<TelematicsService>(TelematicsService);
    timestreamService = module.get<TimestreamService>(TimestreamService);

    // Clear mocks between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // Test: updateLocation
  // =========================================================================
  describe('updateLocation', () => {
    it('should update vehicle location successfully', async () => {
      const locationData: LocationUpdateDto = {
        vehicleId: 'VEH-001',
        latitude: 5.6037,
        longitude: -0.187,
        speed: 45,
        heading: 180,
        accuracy: 5.2,
      };

      mockTimestreamService.writeLocation.mockResolvedValue(undefined);

      await service.updateLocation(locationData);

      expect(timestreamService.writeLocation).toHaveBeenCalledWith({
        vehicleId: locationData.vehicleId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy,
        timestamp: undefined,
      });
      expect(timestreamService.writeLocation).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when updating location', async () => {
      const locationData: LocationUpdateDto = {
        vehicleId: 'VEH-001',
        latitude: 5.6037,
        longitude: -0.187,
      };

      mockTimestreamService.writeLocation.mockRejectedValue(
        new Error('Timestream write error'),
      );

      await expect(service.updateLocation(locationData)).rejects.toThrow(
        'Timestream write error',
      );
    });
  });

  // =========================================================================
  // Test: getCurrentLocation
  // =========================================================================
  describe('getCurrentLocation', () => {
    it('should return current vehicle location', async () => {
      const vehicleId = 'VEH-001';
      const mockLocation = {
        vehicleId,
        time: '2024-11-14T12:00:00Z',
        location: {
          latitude: 5.6037,
          longitude: -0.187,
          speed: 45,
          heading: 180,
        },
      };

      mockTimestreamService.getLatestLocation.mockResolvedValue(mockLocation);

      const result = await service.getCurrentLocation(vehicleId);

      expect(result).toEqual({
        vehicleId,
        latitude: 5.6037,
        longitude: -0.187,
        speed: 45,
        heading: 180,
        timestamp: '2024-11-14T12:00:00Z',
      });
      expect(timestreamService.getLatestLocation).toHaveBeenCalledWith(vehicleId);
    });

    it('should throw NotFoundException when no location data exists', async () => {
      const vehicleId = 'VEH-999';

      mockTimestreamService.getLatestLocation.mockResolvedValue(null);

      await expect(service.getCurrentLocation(vehicleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getCurrentLocation(vehicleId)).rejects.toThrow(
        `No location data found for vehicle ${vehicleId}`,
      );
    });
  });

  // =========================================================================
  // Test: getLocationHistory
  // =========================================================================
  describe('getLocationHistory', () => {
    it('should return location history for date range', async () => {
      const vehicleId = 'VEH-001';
      const startTime = new Date('2024-11-14T00:00:00Z');
      const endTime = new Date('2024-11-14T23:59:59Z');

      const mockHistory = [
        {
          vehicleId,
          time: '2024-11-14T12:00:00Z',
          latitude: '5.6037',
          longitude: '-0.187',
          speed: '45',
          heading: '180',
        },
        {
          vehicleId,
          time: '2024-11-14T13:00:00Z',
          latitude: '5.6137',
          longitude: '-0.207',
          speed: '50',
          heading: '170',
        },
      ];

      mockTimestreamService.queryLocationHistory.mockResolvedValue(mockHistory);

      const result = await service.getLocationHistory(vehicleId, startTime, endTime);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        vehicleId,
        latitude: 5.6037,
        longitude: -0.187,
        speed: 45,
        heading: 180,
        timestamp: '2024-11-14T12:00:00Z',
      });
      expect(timestreamService.queryLocationHistory).toHaveBeenCalledWith(
        vehicleId,
        startTime,
        endTime,
      );
    });
  });

  // =========================================================================
  // Test: getDiagnostics
  // =========================================================================
  describe('getDiagnostics', () => {
    it('should return vehicle diagnostics with calculated fields', async () => {
      const vehicleId = 'VEH-001';
      const mockDiagnostics = {
        vehicleId,
        time: '2024-11-14T12:00:00Z',
        diagnostics: {
          battery_level: 85,
          battery_temp: 35,
          motor_temp: 70,
          speed: 45,
          odometer: 12500,
        },
      };

      mockTimestreamService.getLatestDiagnostics.mockResolvedValue(
        mockDiagnostics,
      );

      const result = await service.getDiagnostics(vehicleId);

      expect(result).toEqual({
        vehicleId,
        batteryLevel: 85,
        batteryHealth: 'EXCELLENT', // >= 80
        speed: 45,
        odometer: 12500,
        motorTemperature: 70,
        batteryTemperature: 35,
        tirePressure: 'NORMAL',
        alerts: [], // No alerts for good diagnostics
        timestamp: expect.any(Date),
      });
    });

    it('should calculate POOR battery health for low level', async () => {
      const vehicleId = 'VEH-002';
      const mockDiagnostics = {
        vehicleId,
        time: '2024-11-14T12:00:00Z',
        diagnostics: {
          battery_level: 25, // Low battery
          battery_temp: 35,
          motor_temp: 70,
          speed: 45,
          odometer: 12500,
        },
      };

      mockTimestreamService.getLatestDiagnostics.mockResolvedValue(
        mockDiagnostics,
      );

      const result = await service.getDiagnostics(vehicleId);

      expect(result?.batteryHealth).toBe('POOR');
    });

    it('should throw NotFoundException when no diagnostics data exists', async () => {
      const vehicleId = 'VEH-999';

      mockTimestreamService.getLatestDiagnostics.mockResolvedValue(null);

      await expect(service.getDiagnostics(vehicleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // Test: checkGeofence
  // =========================================================================
  describe('checkGeofence', () => {
    it('should return true when vehicle is within geofence', async () => {
      const vehicleId = 'VEH-001';
      const mockLocation = {
        vehicleId,
        time: '2024-11-14T12:00:00Z',
        location: {
          latitude: 5.6037, // Accra, Ghana
          longitude: -0.187,
        },
      };

      mockTimestreamService.getLatestLocation.mockResolvedValue(mockLocation);

      // Center very close to vehicle location
      const result = await service.checkGeofence(
        vehicleId,
        5.6037,
        -0.187,
        1000, // 1km radius
      );

      expect(result.inGeofence).toBe(true);
      expect(result.distance).toBeLessThan(1000);
    });

    it('should return false when vehicle is outside geofence', async () => {
      const vehicleId = 'VEH-001';
      const mockLocation = {
        vehicleId,
        time: '2024-11-14T12:00:00Z',
        location: {
          latitude: 5.6037, // Accra
          longitude: -0.187,
        },
      };

      mockTimestreamService.getLatestLocation.mockResolvedValue(mockLocation);

      // Center far from vehicle (10km away)
      const result = await service.checkGeofence(
        vehicleId,
        5.7037,
        -0.287,
        100, // 100m radius - too small
      );

      expect(result.inGeofence).toBe(false);
      expect(result.distance).toBeGreaterThan(100);
    });

    it('should throw NotFoundException when no location data exists', async () => {
      const vehicleId = 'VEH-999';

      mockTimestreamService.getLatestLocation.mockResolvedValue(null);

      await expect(
        service.checkGeofence(vehicleId, 5.6037, -0.187, 1000),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // Test: getAlerts
  // =========================================================================
  describe('getAlerts', () => {
    it('should return empty array for healthy vehicle', async () => {
      const vehicleId = 'VEH-001';
      const mockDiagnostics = {
        vehicleId,
        time: '2024-11-14T12:00:00Z',
        diagnostics: {
          battery_level: 85,
          battery_temp: 35,
          motor_temp: 70,
          speed: 45,
          odometer: 12500,
        },
      };

      mockTimestreamService.getLatestDiagnostics.mockResolvedValue(
        mockDiagnostics,
      );

      const result = await service.getAlerts(vehicleId);

      expect(result).toEqual([]);
    });

    it('should return alerts for problematic diagnostics', async () => {
      const vehicleId = 'VEH-002';
      const mockDiagnostics = {
        vehicleId,
        time: '2024-11-14T12:00:00Z',
        diagnostics: {
          battery_level: 15, // Low battery
          battery_temp: 50, // High temperature
          motor_temp: 85, // High temperature
          speed: 110, // Excessive speed
          odometer: 12500,
        },
      };

      mockTimestreamService.getLatestDiagnostics.mockResolvedValue(
        mockDiagnostics,
      );

      const result = await service.getAlerts(vehicleId);

      expect(result).toContain('LOW_BATTERY');
      expect(result).toContain('HIGH_BATTERY_TEMPERATURE');
      expect(result).toContain('HIGH_MOTOR_TEMPERATURE');
      expect(result).toContain('EXCESSIVE_SPEED');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no diagnostics data exists', async () => {
      const vehicleId = 'VEH-999';

      mockTimestreamService.getLatestDiagnostics.mockResolvedValue(null);

      const result = await service.getAlerts(vehicleId);

      expect(result).toEqual([]);
    });
  });
});
