// ============================================================================
// Booking Module for NestJS - Stop-to-Stop Model
// ============================================================================
// Austin: This module integrates H3 geospatial services for stop-to-stop booking.

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
import { GtfsModule } from '../gtfs/gtfs.module';
// Austin: Import H3 geospatial module for stop-to-stop routing and pricing
import { H3GeospatialModule } from '@app/shared/h3';

@Module({
  imports: [
    TemporalModule,
    TypeOrmModule.forFeature([Booking, Reservation]),
    GtfsModule,
    H3GeospatialModule, // Austin: Provides routing and pricing services
  ],
  controllers: [
    BookingController,
    BookingInternalController,
    NotificationsInternalController,
  ],
  providers: [BookingService, BookingInternalService, NotificationService],
  exports: [BookingService, NotificationService],
})
export class BookingModule {}
