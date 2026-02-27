// ============================================================================
// Booking Module for NestJS - Stop-to-Stop Model
// ============================================================================
// Austin: This module integrates H3 geospatial services for stop-to-stop booking.
// Added: Real-time event emission for booking state changes via WebSocket

import { Module, forwardRef } from '@nestjs/common';
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
import { BookingEventsService } from './services/booking-events.service';
import { GtfsModule } from '../gtfs/gtfs.module';
// Austin: Import H3 geospatial module for stop-to-stop routing and pricing
import { H3GeospatialModule } from '@app/shared/h3';
// Import TelematicsModule for WebSocket gateway access
import { TelematicsModule } from '../telematics/telematics.module';

@Module({
  imports: [
    TemporalModule,
    TypeOrmModule.forFeature([Booking, Reservation]),
    GtfsModule,
    H3GeospatialModule, // Austin: Provides routing and pricing services
    forwardRef(() => TelematicsModule), // For WebSocket gateway access
  ],
  controllers: [
    BookingController,
    BookingInternalController,
    NotificationsInternalController,
  ],
  providers: [
    BookingService,
    BookingInternalService,
    NotificationService,
    BookingEventsService,
  ],
  exports: [BookingService, NotificationService, BookingEventsService],
})
export class BookingModule { }

