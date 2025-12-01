import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { FirebaseService } from '../../firebase/firebase.service';

import { Logger } from '@nestjs/common';

// Mock Firebase Admin SDK
const mockMessagingSend = jest.fn();
const mockFirebaseApp = {
  messaging: () => ({
    send: mockMessagingSend,
  }),
};

// Mock FirebaseService
class MockFirebaseService {
  public app: any = mockFirebaseApp;
  getMessaging() {
    return this.app.messaging();
  }
}

describe('NotificationService', () => {
  let service: NotificationService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: FirebaseService,
          useClass: MockFirebaseService,
        },
        Logger, // Provide Logger as well
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    mockMessagingSend.mockClear(); // Clear mock calls before each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendDriverNotification', () => {
    it('should send a push notification to the driver if deviceToken is provided', async () => {
      const data = {
        driverId: 'driver123',
        bookingId: 'booking456',
        pickupLocation: { latitude: 1, longitude: 1, address: 'Pickup A' },
        dropoffLocation: { latitude: 2, longitude: 2, address: 'Dropoff B' },
        deviceToken: 'test_driver_token',
      };

      await service.sendDriverNotification(data);

      expect(mockMessagingSend).toHaveBeenCalledTimes(1);
      expect(mockMessagingSend).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test_driver_token',
          notification: {
            title: 'New Booking Alert!',
            body: 'You have a new booking from Pickup A to Dropoff B.',
          },
          data: {
            bookingId: 'booking456',
            type: 'NEW_BOOKING',
          },
        }),
      );
    });

    it('should not send a push notification if deviceToken is not provided', async () => {
      const data = {
        driverId: 'driver123',
        bookingId: 'booking456',
        pickupLocation: { latitude: 1, longitude: 1, address: 'Pickup A' },
        dropoffLocation: { latitude: 2, longitude: 2, address: 'Dropoff B' },
      };

      await service.sendDriverNotification(data);

      expect(mockMessagingSend).not.toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    it('should send a push notification if type is PUSH and deviceToken is provided', async () => {
      const data = {
        userId: 'user789',
        type: 'PUSH' as const,
        subject: 'Test Subject',
        message: 'Test Message',
        bookingId: 'booking456',
        deviceToken: 'test_user_token',
      };

      await service.sendNotification(data);

      expect(mockMessagingSend).toHaveBeenCalledTimes(1);
      expect(mockMessagingSend).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test_user_token',
          notification: {
            title: 'Test Subject',
            body: 'Test Message',
          },
          data: {
            userId: 'user789',
            bookingId: 'booking456',
            type: 'GENERAL_NOTIFICATION',
          },
        }),
      );
    });

    it('should not send a push notification if type is PUSH but deviceToken is not provided', async () => {
      const data = {
        userId: 'user789',
        type: 'PUSH' as const,
        subject: 'Test Subject',
        message: 'Test Message',
        bookingId: 'booking456',
      };

      await service.sendNotification(data);

      expect(mockMessagingSend).not.toHaveBeenCalled();
    });

    it('should not send a push notification if type is not PUSH', async () => {
      const data = {
        userId: 'user789',
        type: 'SMS' as const,
        subject: 'Test Subject',
        message: 'Test Message',
        bookingId: 'booking456',
        deviceToken: 'test_user_token',
      };

      await service.sendNotification(data);

      expect(mockMessagingSend).not.toHaveBeenCalled();
    });
  });
});
