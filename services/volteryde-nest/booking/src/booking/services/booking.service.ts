// ============================================================================
// Booking Service for NestJS
// ============================================================================
// This service handles ride booking requests and orchestrates the workflow

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemporalService } from '../../shared/temporal/temporal.service';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { CreateBookingDto, VehicleType } from '../dto/create-booking.dto';
import { SearchRideDto } from '../dto/search-ride.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly TASK_QUEUE = 'volteryde-booking';
  private readonly SPRINGBOOT_API_URL: string;
  private readonly INTERNAL_SERVICE_KEY: string;

  constructor(
    private readonly temporalService: TemporalService,
    private readonly configService: ConfigService,
  ) {
    this.SPRINGBOOT_API_URL = this.configService.get<string>('SPRINGBOOT_API_URL') || 'http://localhost:8080';
    this.INTERNAL_SERVICE_KEY = this.configService.get<string>('INTERNAL_SERVICE_KEY') || 'dev-internal-key';
  }

  /**
   * Search for available rides and get estimates
   */
  async searchRides(query: SearchRideDto): Promise<any[]> {
    this.logger.log(`Searching rides from [${query.startLat}, ${query.startLon}] to [${query.endLat}, ${query.endLon}]`);

    // Mock logic for fare estimation (Distance based)
    const dist = Math.sqrt(
      Math.pow(query.endLat - query.startLat, 2) + Math.pow(query.endLon - query.startLon, 2)
    ) * 111; // Rough km conversion

    return [
      {
        vehicleType: VehicleType.STANDARD,
        price: Math.round(10 + (dist * 2)), // Base 10 + 2 per km
        currency: 'GHS',
        etaMinutes: 5,
      },
      {
        vehicleType: VehicleType.PREMIUM,
        price: Math.round(20 + (dist * 4)), // Base 20 + 4 per km
        currency: 'GHS',
        etaMinutes: 8,
      },
      {
        vehicleType: VehicleType.SHUTTLE,
        price: Math.round(5 + (dist * 1)), // Base 5 + 1 per km
        currency: 'GHS',
        etaMinutes: 15,
      }
    ];
  }

  /**
   * Start a new booking workflow
   */
  async createBooking(request: CreateBookingDto): Promise<BookingResponseDto> {
    this.logger.log(`Creating booking for user ${request.userId}`);

    // Pre-Booking Gated Check: Verify Balance >= 10 GHS
    await this.verifyMinimumBalance(request.userId);

    // Check if Temporal is available
    if (!this.temporalService.isAvailable()) {
      this.logger.error('Temporal service is not available');
      throw new BadRequestException('Booking service is temporarily unavailable. Please try again later.');
    }

    try {
      // Start the workflow
      const workflowId = `booking-${request.userId}-${Date.now()}`;

      // Convert DTO to format expected by Temporal Workflow (if different)
      const execution = await this.temporalService.startWorkflow(
        'bookRideWorkflow',
        [request],
        {
          taskQueue: this.TASK_QUEUE,
          workflowId,
        },
      );

      this.logger.log(`Booking workflow started: ${execution.workflowId}`);

      return {
        workflowId: execution.workflowId,
        status: BookingStatus.PENDING,
        message: 'Your booking is being processed',
      };
    } catch (error) {
      this.logger.error('Failed to start booking workflow:', error);
      throw new BadRequestException('Failed to create booking. Please try again.');
    }
  }

  /**
   * Verifies that the user has at least 10 GHS in their Total Balance.
   */
  private async verifyMinimumBalance(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.SPRINGBOOT_API_URL}/api/v1/wallet/${userId}/balance`, {
        headers: {
          'X-Internal-Service-Key': this.INTERNAL_SERVICE_KEY,
        },
      });

      if (!response.ok) {
        this.logger.error(`Failed to fetch wallet balance: ${response.statusText}`);
        // If wallet service is down, do we block? Yes, safety first.
        throw new Error('Wallet service unreachable');
      }

      const data = await response.json();
      // Expecting { customerId, balance, currency }
      // Note: Spring Boot returns "balance" which is now "totalBalance" in our refactor
      const balance = Number(data.balance);

      if (isNaN(balance) || balance < 10.0) {
        throw new BadRequestException(`Insufficient funds. You need at least 10 GHS to book a ride. Current balance: ${balance}`);
      }

    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error(`Balance check failed for user ${userId}:`, error);
      throw new BadRequestException('Unable to verify wallet balance. Please try again.');
    }
  }

  /**
   * Get booking status by workflow ID
   */
  async getBookingStatus(workflowId: string): Promise<BookingResponseDto> {
    this.logger.log(`Getting booking status for ${workflowId}`);

    if (!this.temporalService.isAvailable()) {
      throw new BadRequestException('Booking service is temporarily unavailable');
    }

    try {
      const currentStatus: BookingStatus = await this.temporalService.queryWorkflow(
        workflowId,
        'getBookingStatus',
      );

      return {
        workflowId,
        status: currentStatus,
      };
    } catch (error: any) {
      if (error.message?.includes('workflow execution already started')) {
        return {
          workflowId,
          status: BookingStatus.PENDING,
          message: 'Booking is still being processed',
        };
      }
      if (error.message?.includes('workflow not found')) {
        throw new NotFoundException(`Booking with ID ${workflowId} not found`);
      }
      return {
        workflowId,
        status: BookingStatus.FAILED,
        message: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Track booking (Status + Driver Info)
   */
  async trackBooking(workflowId: string): Promise<any> {
    const statusDto = await this.getBookingStatus(workflowId);

    // Mock driver info if confirmed
    if (statusDto.status === BookingStatus.CONFIRMED || statusDto.status === BookingStatus.IN_PROGRESS) {
      return {
        ...statusDto,
        driver: {
          name: 'Kwame Mensah',
          rating: 4.8,
          vehicleModel: 'Toyota Prius',
          vehicleColor: 'White',
          licensePlate: 'GW-2024-23',
          phone: '+233541234567'
        },
        etaMinutes: 4,
        currentLocation: {
          lat: 5.6037,
          lon: -0.1870
        }
      };
    }

    return statusDto;
  }

  /**
   * Cancel a booking with dynamic penalty
   */
  async cancelBooking(workflowId: string): Promise<void> {
    this.logger.log(`Cancelling booking ${workflowId}`);

    if (!this.temporalService.isAvailable()) {
      throw new BadRequestException('Booking service is temporarily unavailable');
    }

    try {
      // Instead of just cancelling, we signal the workflow to handle penalty logic
      // If the workflow is already completed, this might fail or do nothing
      // But standard cancellation assumes an active booking

      await this.temporalService.signalWorkflow(workflowId, 'cancelRideSignal', {
        reason: 'User requested cancellation',
        timestamp: new Date()
      });

      this.logger.log(`Cancellation signal sent to: ${workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel booking:`, error);

      // Fallback: If signal fails (e.g. workflow stuck), try standard cancel
      try {
        await this.temporalService.cancelWorkflow(workflowId);
      } catch (e) {
        throw new BadRequestException('Failed to cancel booking');
      }
    }
  }
}
