// ============================================================================
// Booking Service for NestJS
// ============================================================================
// This service handles ride booking requests and orchestrates the workflow

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TemporalService } from '../../shared/temporal/temporal.service';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { CreateBookingDto, VehicleType } from '../dto/create-booking.dto';
import { SearchRideDto } from '../dto/search-ride.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly TASK_QUEUE = 'volteryde-booking';

  constructor(private readonly temporalService: TemporalService) { }

  /**
   * Search for available rides and get estimates
   */
  async searchRides(query: SearchRideDto): Promise<any[]> {
    this.logger.log(`Searching rides from [${query.startLat}, ${query.startLon}] to [${query.endLat}, ${query.endLon}]`);

    // Mock logic for fare estimation (Distance based)
    // In production, this would use Google Maps or OSRM for route distance
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
   * Cancel a booking
   */
  async cancelBooking(workflowId: string): Promise<void> {
    this.logger.log(`Cancelling booking ${workflowId}`);

    if (!this.temporalService.isAvailable()) {
      throw new BadRequestException('Booking service is temporarily unavailable');
    }

    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Booking cancelled: ${workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel booking:`, error);
      throw new BadRequestException('Failed to cancel booking');
    }
  }
}
