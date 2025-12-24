// ============================================================================
// Notification Service
// ============================================================================
// Service for sending notifications

import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async sendDriverNotification(data: {
    driverId: string;
    bookingId: string;
    pickupLocation: { latitude: number; longitude: number; address?: string };
    dropoffLocation: { latitude: number; longitude: number; address?: string };
    passengerName?: string;
    deviceToken?: string; // Added for FCM
  }): Promise<void> {
    this.logger.log(`Notifying driver ${data.driverId} about booking ${data.bookingId}`);

    if (data.deviceToken) {
      const message: admin.messaging.Message = {
        notification: {
          title: 'New Booking Alert!',
          body: `You have a new booking from ${data.pickupLocation.address} to ${data.dropoffLocation.address}.`,
        },
        data: {
          bookingId: data.bookingId,
          type: 'NEW_BOOKING',
        },
        token: data.deviceToken,
      };
      await this.sendPushNotification(message);
    } else {
      // Fallback or log if no device token
      this.logger.warn(`No device token for driver ${data.driverId}. Skipping push notification.`);
    }

    console.log('--- SENDING DRIVER NOTIFICATION ---');
    console.log(`Driver: ${data.driverId}`);
    console.log(`Booking: ${data.bookingId}`);
    console.log(`Pickup: ${data.pickupLocation.address || `${data.pickupLocation.latitude}, ${data.pickupLocation.longitude}`}`);
    console.log(`Dropoff: ${data.dropoffLocation.address || `${data.dropoffLocation.latitude}, ${data.dropoffLocation.longitude}`}`);
    console.log('------------------------------------');
  }

  async sendNotification(data: {
    userId: string;
    type: 'PUSH' | 'SMS' | 'EMAIL';
    subject?: string;
    message: string;
    bookingId?: string;
    deviceToken?: string; // Added for FCM
  }): Promise<void> {
    this.logger.log(`Sending ${data.type} notification to user ${data.userId}`);

    if (data.type === 'PUSH' && data.deviceToken) {
      const message: admin.messaging.Message = {
        notification: {
          title: data.subject || 'Volteryde Notification',
          body: data.message,
        },
        data: {
          userId: data.userId,
          bookingId: data.bookingId || '',
          type: 'GENERAL_NOTIFICATION',
        },
        token: data.deviceToken,
      };
      await this.sendPushNotification(message);
    } else if (data.type === 'SMS') {
      // Implement SMS sending logic (e.g., Twilio)
      this.logger.log(`SMS sending not yet implemented for user ${data.userId}: ${data.message}`);
    } else if (data.type === 'EMAIL') {
      // Implement Email sending logic (e.g., SendGrid)
      this.logger.log(`Email sending not yet implemented for user ${data.userId}: ${data.message}`);
    } else {
      this.logger.warn(`Unsupported notification type or missing device token for user ${data.userId}. Skipping notification.`);
    }

    console.log('--- SENDING PASSENGER NOTIFICATION ---');
    console.log(`User: ${data.userId}`);
    console.log(`Type: ${data.type}`);
    console.log(`Subject: ${data.subject || ''}`);
    console.log(`Message: ${data.message}`);
    console.log('------------------------------------');
  }

  private async sendPushNotification(message: admin.messaging.Message): Promise<void> {
    try {
      const messaging = this.firebaseService.getMessaging();
      if (!messaging) {
        this.logger.warn('Firebase Messaging not initialized. Push notification not sent.');
        return;
      }
      const response = await messaging.send(message);
      this.logger.log(`Successfully sent FCM message: ${response}`);
    } catch (error) {
      this.logger.error(`Failed to send FCM message: ${error}`);
      // TODO: Implement retry logic or dead-letter queue for failed messages
    }
  }
}
