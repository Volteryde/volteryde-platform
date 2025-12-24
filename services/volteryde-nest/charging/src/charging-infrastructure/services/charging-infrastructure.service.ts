// ============================================================================
// Charging Infrastructure Service
// ============================================================================

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingStation, StationStatus } from '../entities/charging-station.entity';
import { ChargingSession, SessionStatus } from '../entities/charging-session.entity';
import { CreateStationDto } from '../dto/create-station.dto';
import { StartSessionDto } from '../dto/start-session.dto';
import { TemporalService } from '../../shared/temporal/temporal.service';

@Injectable()
export class ChargingInfrastructureService {
  private readonly logger = new Logger(ChargingInfrastructureService.name);
  private readonly TASK_QUEUE = 'volteryde-charging';

  constructor(
    @InjectRepository(ChargingStation)
    private stationRepository: Repository<ChargingStation>,
    @InjectRepository(ChargingSession)
    private sessionRepository: Repository<ChargingSession>,
    private readonly temporalService: TemporalService,
  ) {}

  async createStation(dto: CreateStationDto): Promise<ChargingStation> {
    this.logger.log(`Creating charging station ${dto.stationId}`);
    const station = this.stationRepository.create({
      ...dto,
      connectorCount: dto.connectors.length,
      connectors: dto.connectors.map(c => ({ ...c, isAvailable: true })),
    });
    return await this.stationRepository.save(station);
  }

  async findStationById(stationId: string): Promise<ChargingStation> {
    const station = await this.stationRepository.findOne({ where: { stationId } });
    if (!station) {
      throw new NotFoundException(`Charging station ${stationId} not found`);
    }
    return station;
  }

  async findAvailableStations(): Promise<ChargingStation[]> {
    return await this.stationRepository.find({ where: { status: StationStatus.AVAILABLE } });
  }

  /**
   * Start a charging session via Temporal Workflow (Public API)
   */
  async startSession(dto: StartSessionDto): Promise<any> {
    this.logger.log(`Initiating charging session workflow for vehicle ${dto.vehicleId} at station ${dto.stationId}`);

    if (!this.temporalService.isAvailable()) {
      this.logger.error('Temporal service is not available');
      throw new BadRequestException('Charging service is temporarily unavailable.');
    }

    try {
      const workflowId = `charging-${dto.stationId}-${dto.connectorId}-${Date.now()}`;

      const execution = await this.temporalService.startWorkflow(
        'chargeVehicleWorkflow',
        [dto],
        {
          taskQueue: this.TASK_QUEUE,
          workflowId,
        },
      );

      this.logger.log(`Charging workflow started: ${execution.workflowId}`);

      return {
        workflowId: execution.workflowId,
        status: 'PENDING',
        message: 'Charging session initiation in progress',
      };
    } catch (error) {
      this.logger.error('Failed to start charging workflow:', error);
      throw new BadRequestException('Failed to start charging session.');
    }
  }

  /**
   * Internal method called by Temporal Activity to actually start the session
   */
  async internalStartSession(dto: StartSessionDto): Promise<ChargingSession> {
    this.logger.log(`INTERNAL: Starting charging session for vehicle ${dto.vehicleId} at station ${dto.stationId}`);
    const station = await this.findStationById(dto.stationId);

    const connector = station.connectors.find(c => c.connectorId === dto.connectorId);
    if (!connector || !connector.isAvailable) {
      throw new NotFoundException(`Connector ${dto.connectorId} at station ${dto.stationId} is not available`);
    }

    // Update connector status
    connector.isAvailable = false;
    await this.stationRepository.save(station);

    const session = this.sessionRepository.create({
      ...dto,
      startTime: new Date(),
      status: SessionStatus.IN_PROGRESS,
    });
    return await this.sessionRepository.save(session);
  }

  async stopSession(sessionId: string, energyConsumedKwh: number, cost: number): Promise<ChargingSession> {
    // TODO: Migrate this to Temporal as well. For now, we leave it synchronous
    // but arguably it should also be a workflow or a signal to the running workflow.
    this.logger.log(`Stopping charging session ${sessionId}`);
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Charging session ${sessionId} not found`);
    }

    session.endTime = new Date();
    session.energyConsumedKwh = energyConsumedKwh;
    session.cost = cost;
    session.status = SessionStatus.COMPLETED;

    const station = await this.findStationById(session.stationId);
    const connector = station.connectors.find(c => c.connectorId === session.connectorId);
    if (connector) {
      connector.isAvailable = true;
      await this.stationRepository.save(station);
    }

    return await this.sessionRepository.save(session);
  }

  async getSession(sessionId: string): Promise<ChargingSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Charging session ${sessionId} not found`);
    }
    return session;
  }
}
