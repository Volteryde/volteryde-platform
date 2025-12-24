// ============================================================================
// Telematics Module
// ============================================================================
// This module handles real-time vehicle tracking, diagnostics, and live updates
// Using AWS Timestream for time-series data storage

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelematicsController } from './controllers/telematics.controller';
import { TelematicsService } from './services/telematics.service';
import { TimestreamService } from './services/timestream.service';
import { TelematicsGateway } from './gateways/telematics.gateway';
import { InfluxDbService } from './influx/influxdb.service';

@Module({
  imports: [ConfigModule],
  controllers: [TelematicsController],
  providers: [TelematicsService, TimestreamService, TelematicsGateway, InfluxDbService],
  exports: [TelematicsService, InfluxDbService],
})
export class TelematicsModule { }
