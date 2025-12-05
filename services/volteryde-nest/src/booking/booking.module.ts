// ============================================================================
// Booking Module for NestJS
// ============================================================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingInternalController } from './controllers/booking-internal.controller';
import { NotificationsInternalController } from './controllers/notifications-internal.controller';
import { TemporalModule } from '../shared/temporal/temporal.module';
import { Booking } from './entities/booking.entity';
import { Reservation } from './entities/reservation.entity';
import { BookingInternalService } from './services/booking-internal.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [TemporalModule, TypeOrmModule.forFeature([Booking, Reservation])],
  controllers: [
    BookingController,
    BookingInternalController,
    NotificationsInternalController,
  ],
  providers: [BookingService, BookingInternalService, NotificationService],
  exports: [BookingService, NotificationService],
})
export class BookingModule {}
