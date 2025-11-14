// ============================================================================
// Booking Module for NestJS
// ============================================================================

import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { TemporalModule } from '../shared/temporal/temporal.module';

@Module({
  imports: [TemporalModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
