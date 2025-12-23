// ============================================================================
// Fleet Operations Module
// ============================================================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Driver } from './entities/driver.entity';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { DriverVehicleAssignment } from './entities/driver-vehicle-assignment.entity';
import { VehicleService } from './services/vehicle.service';
import { DriverVehicleAssignmentService } from './services/driver-vehicle-assignment.service'; // Import new service
import { VehiclesController } from './controllers/vehicles.controller';
import { FleetChargingController } from './controllers/fleet-charging.controller';
import { FleetReportsController } from './controllers/fleet-reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, Driver, MaintenanceRecord, DriverVehicleAssignment]),
  ],
  controllers: [VehiclesController, FleetChargingController, FleetReportsController],
  providers: [VehicleService, DriverVehicleAssignmentService],
  exports: [VehicleService, DriverVehicleAssignmentService],
})
export class FleetOperationsModule { }
