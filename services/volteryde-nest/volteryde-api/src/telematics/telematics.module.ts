// ============================================================================
// Telematics Module
// ============================================================================
// This module handles real-time vehicle tracking, diagnostics, and live updates
// Using AWS Timestream for time-series data storage
// WebSocket gateway for real-time client communication

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelematicsController } from './controllers/telematics.controller';
import { TelematicsService } from './services/telematics.service';
import { TimestreamService } from './services/timestream.service';
import { TelematicsGateway } from './gateways/telematics.gateway';
import { MqttModule } from '../mqtt/mqtt.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [
    ConfigModule,
    MqttModule,
    forwardRef(() => BookingModule), // Use forwardRef to handle circular dependency
  ],
  controllers: [TelematicsController],
  providers: [TelematicsService, TimestreamService, TelematicsGateway],
  exports: [TelematicsService, TelematicsGateway],
})
export class TelematicsModule { }

