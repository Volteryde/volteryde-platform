// ============================================================================
// Booking Module for NestJS
// ============================================================================

import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingInternalController } from './controllers/booking-internal.controller';
import { NotificationsInternalController } from './controllers/notifications-internal.controller';
import { TemporalModule } from '../shared/temporal/temporal.module';

@Module({
  imports: [TemporalModule],
  controllers: [
    BookingController,
    BookingInternalController,
    NotificationsInternalController,
  ],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
