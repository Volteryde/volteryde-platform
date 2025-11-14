// ============================================================================
// Booking Service for NestJS
// ============================================================================
// This service handles ride booking requests and orchestrates the workflow

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TemporalService } from '../shared/temporal/temporal.service';

// Import types from temporal-workers (shared in monorepo)
interface GpsLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface BookingRequest {
  userId: string;
  startLocation: GpsLocation;
  endLocation: GpsLocation;
  vehicleType?: 'STANDARD' | 'PREMIUM' | 'SHUTTLE';
  scheduledTime?: Date;
  passengerCount?: number;
}

interface BookingConfirmation {
  bookingId: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  vehicleId: string;
  driverId: string;
  estimatedArrivalTime: Date;
  fare: number;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly TASK_QUEUE = 'volteryde-booking';

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Start a new booking workflow
   * 
   * This method initiates the durable booking workflow in Temporal.
   * The workflow will handle:
   * - Seat reservation
   * - Payment processing
   * - Booking confirmation
   * - Driver and passenger notifications
   * - Saga compensation if anything fails
   * 
   * @param request - Booking request details
   * @returns Workflow execution details
   */
  async createBooking(request: BookingRequest) {
    this.logger.log(`Creating booking for user ${request.userId}`);

    // Validate request
    this.validateBookingRequest(request);

    // Check if Temporal is available
    if (!this.temporalService.isAvailable()) {
      this.logger.error('Temporal service is not available');
      throw new BadRequestException('Booking service is temporarily unavailable. Please try again later.');
    }

    try {
      // Start the workflow
      const workflowId = `booking-${request.userId}-${Date.now()}`;
      
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
        runId: execution.runId,
        status: 'PROCESSING',
        message: 'Your booking is being processed',
      };
    } catch (error) {
      this.logger.error('Failed to start booking workflow:', error);
      throw new BadRequestException('Failed to create booking. Please try again.');
    }
  }

  /**
   * Get booking status by workflow ID
   * 
   * @param workflowId - The workflow/booking ID
   * @returns Booking confirmation or status
   */
  async getBookingStatus(workflowId: string): Promise<any> {
    this.logger.log(`Getting booking status for ${workflowId}`);

    if (!this.temporalService.isAvailable()) {
      throw new BadRequestException('Booking service is temporarily unavailable');
    }

    try {
      // Try to get the workflow result (this will wait if workflow is still running)
      const result = await this.temporalService.getWorkflowResult<BookingConfirmation>(workflowId);
      
      this.logger.log(`Booking completed: ${result.bookingId}`);
      
      return {
        workflowId,
        status: 'COMPLETED',
        booking: result,
      };
    } catch (error: any) {
      // If workflow is still running or failed
      if (error.message?.includes('workflow execution already started')) {
        return {
          workflowId,
          status: 'PROCESSING',
          message: 'Booking is still being processed',
        };
      }

      if (error.message?.includes('workflow not found')) {
        throw new NotFoundException(`Booking with ID ${workflowId} not found`);
      }

      this.logger.error(`Error getting booking status:`, error);
      
      return {
        workflowId,
        status: 'FAILED',
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Cancel a booking
   * 
   * @param workflowId - The workflow/booking ID
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

  /**
   * Validate booking request
   */
  private validateBookingRequest(request: BookingRequest): void {
    if (!request.userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!request.startLocation || !request.endLocation) {
      throw new BadRequestException('Start and end locations are required');
    }

    if (
      !this.isValidLocation(request.startLocation) ||
      !this.isValidLocation(request.endLocation)
    ) {
      throw new BadRequestException('Invalid GPS coordinates');
    }

    // Ensure locations are different
    if (
      request.startLocation.latitude === request.endLocation.latitude &&
      request.startLocation.longitude === request.endLocation.longitude
    ) {
      throw new BadRequestException('Start and end locations must be different');
    }
  }

  /**
   * Validate GPS location
   */
  private isValidLocation(location: GpsLocation): boolean {
    return (
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180
    );
  }
}
