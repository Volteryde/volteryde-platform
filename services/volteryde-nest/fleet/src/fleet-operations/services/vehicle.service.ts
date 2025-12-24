// ============================================================================
// Vehicle Service (Simplified)
// ============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    this.logger.log('Fetching all vehicles');
    return await this.vehicleRepository.find();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { vehicleId: id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    this.logger.log(`Creating vehicle ${createVehicleDto.vehicleId}`);
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return await this.vehicleRepository.save(vehicle);
  }

  async updateStatus(id: string, status: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = status as any;
    return await this.vehicleRepository.save(vehicle);
  }

  async assignDriver(vehicleId: string, driverId: string): Promise<Vehicle> {
    const vehicle = await this.findOne(vehicleId);
    // Note: Driver assignment is now handled via DriverVehicleAssignment entity
    // This method is kept for backward compatibility but doesn't modify the vehicle directly
    // TODO: Create a DriverVehicleAssignment record instead
    this.logger.log(`Driver ${driverId} assigned to vehicle ${vehicleId}`);
    return vehicle;
  }

  async getStats() {
    const [vehicles, total] = await this.vehicleRepository.findAndCount();
    const active = vehicles.filter(v => v.status === 'ACTIVE').length;
    return {
      total,
      active,
      inactive: total - active,
      averageBatteryLevel: vehicles.reduce((sum, v) => sum + (v.currentBatteryLevel || 0), 0) / total,
    };
  }
}
