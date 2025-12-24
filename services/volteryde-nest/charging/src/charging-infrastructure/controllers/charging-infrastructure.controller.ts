// ============================================================================
// Charging Infrastructure Controller
// ============================================================================

import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChargingInfrastructureService } from '../services/charging-infrastructure.service';
import { CreateStationDto } from '../dto/create-station.dto';
import { StartSessionDto } from '../dto/start-session.dto';

@ApiTags('Charging Infrastructure')
@Controller('api/v1/charging')
export class ChargingInfrastructureController {
  constructor(private readonly chargingService: ChargingInfrastructureService) {}

  @Post('stations')
  @ApiOperation({ summary: 'Create a new charging station' })
  @ApiResponse({ status: 201, description: 'Station created successfully' })
  async createStation(@Body() createStationDto: CreateStationDto) {
    return await this.chargingService.createStation(createStationDto);
  }

  @Get('stations/available')
  @ApiOperation({ summary: 'Get all available charging stations' })
  @ApiResponse({ status: 200, description: 'List of available stations' })
  async getAvailableStations() {
    return await this.chargingService.findAvailableStations();
  }

  @Get('stations/:stationId')
  @ApiOperation({ summary: 'Get charging station details' })
  @ApiResponse({ status: 200, description: 'Station details' })
  async getStation(@Param('stationId') stationId: string) {
    return await this.chargingService.findStationById(stationId);
  }

  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a new charging session (Trigger Workflow)' })
  @ApiResponse({ status: 201, description: 'Session workflow started' })
  async startSession(@Body() startSessionDto: StartSessionDto) {
    // This now triggers the workflow
    return await this.chargingService.startSession(startSessionDto);
  }

  @Post('internal/sessions/start')
  @ApiOperation({ summary: 'Internal: Start session (Called by Worker)' })
  @ApiResponse({ status: 201, description: 'Session started in DB' })
  async internalStartSession(@Body() startSessionDto: StartSessionDto) {
    // This does the actual DB work
    return await this.chargingService.internalStartSession(startSessionDto);
  }

  @Patch('sessions/:sessionId/stop')
  @ApiOperation({ summary: 'Stop a charging session' })
  @ApiResponse({ status: 200, description: 'Session stopped successfully' })
  async stopSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { energyConsumedKwh: number; cost: number },
  ) {
    return await this.chargingService.stopSession(sessionId, body.energyConsumedKwh, body.cost);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get charging session details' })
  @ApiResponse({ status: 200, description: 'Session details' })
  async getSession(@Param('sessionId') sessionId: string) {
    return await this.chargingService.getSession(sessionId);
  }
}
