import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverVehicleAssignment, AssignmentStatus } from '../entities/driver-vehicle-assignment.entity';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';

@Injectable()
export class DriverVehicleAssignmentService {
  private readonly logger = new Logger(DriverVehicleAssignmentService.name);

  constructor(
    @InjectRepository(DriverVehicleAssignment)
    private assignmentRepository: Repository<DriverVehicleAssignment>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async assignDriverToVehicle(driverId: string, vehicleId: string): Promise<DriverVehicleAssignment> {
    this.logger.log(`Attempting to assign driver ${driverId} to vehicle ${vehicleId}`);

    const driver = await this.driverRepository.findOne({ where: { driverId } });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found.`);
    }

    const vehicle = await this.vehicleRepository.findOne({ where: { vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found.`);
    }

    // Check for existing active assignment for this driver
    const existingDriverAssignment = await this.assignmentRepository.findOne({
      where: { driverId: driver.id, status: AssignmentStatus.ACTIVE },
    });
    if (existingDriverAssignment) {
      throw new BadRequestException(`Driver ${driverId} is already actively assigned to vehicle ${existingDriverAssignment.vehicleId}.`);
    }

    // Check for existing active assignment for this vehicle
    const existingVehicleAssignment = await this.assignmentRepository.findOne({
      where: { vehicleId: vehicle.id, status: AssignmentStatus.ACTIVE },
    });
    if (existingVehicleAssignment) {
      throw new BadRequestException(`Vehicle ${vehicleId} is already actively assigned to driver ${existingVehicleAssignment.driverId}.`);
    }

    const assignment = this.assignmentRepository.create({
      driverId: driver.id,
      vehicleId: vehicle.id,
      assignmentStartTime: new Date(),
      status: AssignmentStatus.ACTIVE,
    });

    await this.assignmentRepository.save(assignment);
    this.logger.log(`Driver ${driverId} successfully assigned to vehicle ${vehicleId}. Assignment ID: ${assignment.id}`);
    return assignment;
  }

  async revokeAssignment(assignmentId: string): Promise<DriverVehicleAssignment> {
    this.logger.log(`Attempting to revoke assignment ${assignmentId}`);
    const assignment = await this.assignmentRepository.findOne({ where: { id: assignmentId, status: AssignmentStatus.ACTIVE } });

    if (!assignment) {
      throw new NotFoundException(`Active assignment with ID ${assignmentId} not found.`);
    }

    assignment.assignmentEndTime = new Date();
    assignment.status = AssignmentStatus.COMPLETED;
    await this.assignmentRepository.save(assignment);
    this.logger.log(`Assignment ${assignmentId} successfully revoked.`);
    return assignment;
  }

  async findActiveAssignmentByVehicleId(vehicleId: string): Promise<DriverVehicleAssignment | null> {
    return await this.assignmentRepository.findOne({
      where: { vehicleId, status: AssignmentStatus.ACTIVE },
      relations: ['driver', 'vehicle'], // Eager load driver and vehicle details
    });
  }

  async findActiveAssignmentByDriverId(driverId: string): Promise<DriverVehicleAssignment | null> {
    return await this.assignmentRepository.findOne({
      where: { driverId, status: AssignmentStatus.ACTIVE },
      relations: ['driver', 'vehicle'], // Eager load driver and vehicle details
    });
  }
}
