// ============================================================================
// Fleet Operations Module
// ============================================================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Driver } from './entities/driver.entity';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { VehicleService } from './services/vehicle.service';
import { VehiclesController } from './controllers/vehicles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, Driver, MaintenanceRecord]),
  ],
  controllers: [VehiclesController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class FleetOperationsModule {}
