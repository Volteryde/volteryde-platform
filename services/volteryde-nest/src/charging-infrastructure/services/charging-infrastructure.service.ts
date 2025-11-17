// ============================================================================
// Charging Infrastructure Service
// ============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingStation, StationStatus } from '../entities/charging-station.entity';
import { ChargingSession, SessionStatus } from '../entities/charging-session.entity';
import { CreateStationDto } from '../dto/create-station.dto';
import { StartSessionDto } from '../dto/start-session.dto';

@Injectable()
export class ChargingInfrastructureService {
  private readonly logger = new Logger(ChargingInfrastructureService.name);

  constructor(
    @InjectRepository(ChargingStation)
    private stationRepository: Repository<ChargingStation>,
    @InjectRepository(ChargingSession)
    private sessionRepository: Repository<ChargingSession>,
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

  async startSession(dto: StartSessionDto): Promise<ChargingSession> {
    this.logger.log(`Starting charging session for vehicle ${dto.vehicleId} at station ${dto.stationId}`);
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
