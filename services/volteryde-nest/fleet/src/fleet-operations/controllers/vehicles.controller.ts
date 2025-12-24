// ============================================================================
// Vehicles Controller (Simplified)
// ============================================================================

import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { VehicleService } from '../services/vehicle.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { VehicleResponseDto, UpdateVehicleStatusDto, AssignDriverDto } from '../dto/fleet-responses.dto';

@ApiTags('Fleet - Vehicles')
@Controller('api/v1/fleet/vehicles')
export class VehiclesController {
  constructor(private vehicleService: VehicleService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiResponse({ status: 200, type: [VehicleResponseDto] })
  async findAll() {
    return await this.vehicleService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Add new vehicle to fleet' })
  @ApiResponse({ status: 201, type: VehicleResponseDto })
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return await this.vehicleService.create(createVehicleDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details' })
  @ApiParam({ name: 'id', example: 'VEH-001' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async findOne(@Param('id') id: string) {
    return await this.vehicleService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update vehicle status' })
  @ApiParam({ name: 'id', example: 'VEH-001' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateVehicleStatusDto) {
    return await this.vehicleService.updateStatus(id, dto.status);
  }

  @Post(':id/assign-driver')
  @ApiOperation({ summary: 'Assign driver to vehicle' })
  @ApiParam({ name: 'id', example: 'VEH-001' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return await this.vehicleService.assignDriver(id, dto.driverId);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get fleet statistics' })
  async getStats() {
    return await this.vehicleService.getStats();
  }
}
