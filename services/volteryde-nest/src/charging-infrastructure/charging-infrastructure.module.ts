// ============================================================================
// Charging Infrastructure Module
// ============================================================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargingStation } from './entities/charging-station.entity';
import { ChargingSession } from './entities/charging-session.entity';
import { ChargingInfrastructureService } from './services/charging-infrastructure.service';
import { ChargingInfrastructureController } from './controllers/charging-infrastructure.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargingStation, ChargingSession]),
  ],
  controllers: [ChargingInfrastructureController],
  providers: [ChargingInfrastructureService],
  exports: [ChargingInfrastructureService],
})
export class ChargingInfrastructureModule {}
