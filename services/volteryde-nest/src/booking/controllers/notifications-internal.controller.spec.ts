import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsInternalController } from './notifications-internal.controller';
import { NotificationService } from '../services/notification.service';
import { InternalServiceGuard } from '../../shared/guards/internal-service.guard';
import { Logger } from '@nestjs/common';

describe('NotificationsInternalController', () => {
  let controller: NotificationsInternalController;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsInternalController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            sendDriverNotification: jest.fn(),
            sendNotification: jest.fn(),
          },
        },
        {
          provide: InternalServiceGuard,
          useValue: {
            canActivate: jest.fn(() => true), // Mock guard to always allow
          },
        },
        Logger, // Provide Logger
      ],
    }).compile();

    controller = module.get<NotificationsInternalController>(NotificationsInternalController);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('notifyDriver', () => {
    it('should call notificationService.sendDriverNotification with the correct data', async () => {
      const data = {
        driverId: 'driver123',
        bookingId: 'booking456',
        pickupLocation: { latitude: 1, longitude: 1, address: 'Pickup A' },
        dropoffLocation: { latitude: 2, longitude: 2, address: 'Dropoff B' },
        passengerName: 'John Doe',
        deviceToken: 'test_driver_token',
      };

      await controller.notifyDriver(data);

      expect(notificationService.sendDriverNotification).toHaveBeenCalledWith(data);
    });
  });

  describe('sendNotification', () => {
    it('should call notificationService.sendNotification with the correct data', async () => {
      const data = {
        userId: 'user789',
        type: 'PUSH' as const,
        subject: 'Test Subject',
        message: 'Test Message',
        bookingId: 'booking456',
        deviceToken: 'test_user_token',
      };

      await controller.sendNotification(data);

      expect(notificationService.sendNotification).toHaveBeenCalledWith(data);
    });
  });
});
