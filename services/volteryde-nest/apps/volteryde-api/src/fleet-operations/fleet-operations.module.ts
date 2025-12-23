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

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, Driver, MaintenanceRecord, DriverVehicleAssignment]),
  ],
  controllers: [VehiclesController],
  providers: [VehicleService, DriverVehicleAssignmentService], // Add new service
  exports: [VehicleService, DriverVehicleAssignmentService], // Export new service
})
export class FleetOperationsModule {}
