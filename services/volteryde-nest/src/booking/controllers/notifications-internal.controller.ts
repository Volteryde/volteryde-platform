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
import { NotificationService } from '../services/notification.service';

@ApiTags('Internal - Notifications')
@Controller('api/v1/notifications/internal')
@UseGuards(InternalServiceGuard)
export class NotificationsInternalController {
  private readonly logger = new Logger(NotificationsInternalController.name);
  
  constructor(private notificationService: NotificationService) {}

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
    await this.notificationService.sendDriverNotification(data);
    return {
      success: true,
      message: `Driver ${data.driverId} notified successfully`,
    };
  }

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
    await this.notificationService.sendNotification(data);
    return {
      success: true,
      message: `${data.type} notification sent to user ${data.userId}`,
    };
  }
}
