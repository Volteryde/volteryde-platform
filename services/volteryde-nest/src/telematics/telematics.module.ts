// ============================================================================
// Telematics Module
// ============================================================================
// This module handles real-time vehicle tracking, diagnostics, and live updates
// Using AWS Timestream for time-series data storage

import { Module } from '@nestjs/common';
import { TelematicsController } from './controllers/telematics.controller';
import { TelematicsService } from './services/telematics.service';
import { TimestreamService } from './services/timestream.service';
import { TelematicsGateway } from './gateways/telematics.gateway';

@Module({
  controllers: [TelematicsController],
  providers: [TelematicsService, TimestreamService, TelematicsGateway],
  exports: [TelematicsService],
})
export class TelematicsModule {}
