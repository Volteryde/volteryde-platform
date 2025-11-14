// ============================================================================
// Notifications Internal Controller
// ============================================================================
// Internal endpoints for sending notifications (called by Temporal workers)

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InternalServiceGuard } from '../../shared/guards/internal-service.guard';

// TODO: Import notification service when created
// import { NotificationService } from '../services/notification.service';

@ApiTags('Internal - Notifications')
@Controller('api/v1/notifications/internal')
@UseGuards(InternalServiceGuard)
export class NotificationsInternalController {
  private readonly logger = new Logger(NotificationsInternalController.name);
  
  // constructor(private notificationService: NotificationService) {}

  // =========================================================================
  // Internal Endpoint 4: Notify Driver (Temporal Activity)
  // =========================================================================
  @Post('driver')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: '[INTERNAL] Send notification to driver' })
  @ApiResponse({ status: 200, description: 'Driver notified successfully' })
  async notifyDriver(
    @Body()
    data: {
      driverId: string;
      bookingId: string;
      pickupLocation: { latitude: number; longitude: number; address?: string };
      dropoffLocation: { latitude: number; longitude: number; address?: string };
      passengerName?: string;
    },
  ) {
    this.logger.log(`Notifying driver ${data.driverId} about booking ${data.bookingId}`);

    // TODO: Implement actual notification logic (FCM, SMS, etc.)
    // await this.notificationService.sendDriverNotification(data);

    // Placeholder implementation
    const notification = {
      success: true,
      driverId: data.driverId,
      bookingId: data.bookingId,
      channel: 'PUSH', // Could be PUSH, SMS, EMAIL
      message: `New booking ${data.bookingId} assigned`,
      sentAt: new Date(),
    };

    this.logger.log(`Driver ${data.driverId} notified successfully`);
    return notification;
  }

  // =========================================================================
  // Internal Endpoint 5: Send Passenger Notification (Temporal Activity)
  // =========================================================================
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: '[INTERNAL] Send notification to passenger' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(
    @Body()
    data: {
      userId: string;
      type: 'PUSH' | 'SMS' | 'EMAIL';
      subject?: string;
      message: string;
      bookingId?: string;
    },
  ) {
    this.logger.log(`Sending ${data.type} notification to user ${data.userId}`);

    // TODO: Implement actual notification logic
    // await this.notificationService.sendNotification(data);

    // Placeholder implementation
    const notification = {
      success: true,
      userId: data.userId,
      type: data.type,
      message: data.message,
      sentAt: new Date(),
    };

    this.logger.log(`${data.type} notification sent to user ${data.userId}`);
    return notification;
  }
}
