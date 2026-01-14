// ============================================================================
// Booking Service for NestJS - Stop-to-Stop Model
// ============================================================================
// Austin: This service handles stop-to-stop ride bookings with H3 geospatial
// and distance-based pricing. Users book rides between predefined stops.

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TemporalService } from '../shared/temporal/temporal.service';
import { BookingStatus } from '../../../libs/shared/src/enums/booking-status.enum';
import { GtfsService } from '../gtfs/services/gtfs.service';
import {
  StopToStopRoutingService,
  DistancePricingService,
  RedisH3SpatialService,
} from '@app/shared/h3';
import { CreateBookingDto } from './dto/booking-request.dto';
import {
  BookingConfirmationDto,
  BookingStatusResponseDto,
  FareEstimateResponseDto,
  NearbyStopsResponseDto,
  StopResponseDto,
} from './dto/booking-response.dto';

// Austin: Legacy interface - kept for backward compatibility with old API
interface GpsLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

// Austin: Legacy interface - old booking model before stop-to-stop
interface LegacyBookingRequest {
  userId: string;
  startLocation: GpsLocation;
  endLocation: GpsLocation;
  vehicleType?: 'STANDARD' | 'PREMIUM' | 'SHUTTLE';
  scheduledTime?: Date;
  passengerCount?: number;
  tripId?: string;
  fromStopId?: string;
  toStopId?: string;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly TASK_QUEUE = 'volteryde-booking';

  constructor(
    private readonly temporalService: TemporalService,
    private readonly gtfsService: GtfsService,
    private readonly stopToStopRouting: StopToStopRoutingService,
    private readonly distancePricing: DistancePricingService,
    private readonly redisH3Spatial: RedisH3SpatialService,
  ) {}

  // ========================================================================
  // Austin: NEW Stop-to-Stop Booking Methods
  // ========================================================================

  /**
   * Austin: Create a stop-to-stop booking.
   * This is the primary booking method for the new model.
   */
  async createStopToStopBooking(request: CreateBookingDto): Promise<BookingConfirmationDto> {
    this.logger.log(`Creating stop-to-stop booking for user ${request.userId}`);

    // Validate stops exist and are different
    const [pickupStop, dropoffStop] = await Promise.all([
      this.gtfsService.getStop(request.pickupStopId),
      this.gtfsService.getStop(request.dropoffStopId),
    ]);

    if (request.pickupStopId === request.dropoffStopId) {
      throw new BadRequestException('Pickup and dropoff stops must be different');
    }

    // Calculate route and fare
    const route = await this.stopToStopRouting.calculateRoute(
      request.pickupStopId,
      request.dropoffStopId,
    );

    // Check Temporal availability
    if (!this.temporalService.isAvailable()) {
      this.logger.error('Temporal service is not available');
      throw new BadRequestException('Booking service temporarily unavailable');
    }

    try {
      const workflowId = `booking-${request.userId}-${Date.now()}`;

      // Start workflow with stop-to-stop data
      const execution = await this.temporalService.startWorkflow(
        'bookRideWorkflow',
        [{
          userId: request.userId,
          pickupStopId: request.pickupStopId,
          dropoffStopId: request.dropoffStopId,
          distanceMeters: route.distanceMeters,
          fare: route.fare,
          passengerCount: request.passengerCount || 1,
          scheduledTime: request.scheduledTime,
          tripId: request.tripId,
        }],
        {
          taskQueue: this.TASK_QUEUE,
          workflowId,
        },
      );

      this.logger.log(`Booking workflow started: ${execution.workflowId}`);

      return {
        bookingId: execution.workflowId,
        runId: execution.runId,
        status: BookingStatus.PENDING,
        message: 'Your booking is being processed',
        pickupStop: this.mapStopToDto(pickupStop),
        dropoffStop: this.mapStopToDto(dropoffStop),
        fare: {
          baseFare: route.fare.baseFare,
          distanceFare: route.fare.distanceCharge,
          totalFare: route.fare.totalFare,
          pricingZone: route.fare.pickupZone,
          distanceKm: route.distanceMeters / 1000,
        },
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to start booking workflow:', error);
      throw new BadRequestException('Failed to create booking');
    }
  }

  /**
   * Austin: Get fare estimate between two stops without creating a booking.
   */
  async getFareEstimate(
    pickupStopId: string,
    dropoffStopId: string,
    passengerCount?: number,
  ): Promise<FareEstimateResponseDto> {
    // Validate stops exist
    const [pickupStop, dropoffStop] = await Promise.all([
      this.gtfsService.getStop(pickupStopId),
      this.gtfsService.getStop(dropoffStopId),
    ]);

    if (pickupStopId === dropoffStopId) {
      throw new BadRequestException('Pickup and dropoff stops must be different');
    }

    // Calculate route and fare
    const route = await this.stopToStopRouting.calculateRoute(
      pickupStopId,
      dropoffStopId,
    );

    const perPassengerFare = passengerCount && passengerCount > 1
      ? route.fare.totalFare / passengerCount
      : undefined;

    return {
      pickupStop: this.mapStopToDto(pickupStop),
      dropoffStop: this.mapStopToDto(dropoffStop),
      distanceMeters: route.distanceMeters,
      estimatedDurationSeconds: route.durationSeconds,
      fare: {
        baseFare: route.fare.baseFare,
        distanceFare: route.fare.distanceCharge,
        totalFare: route.fare.totalFare,
        pricingZone: route.fare.pickupZone,
        distanceKm: route.distanceMeters / 1000,
        perPassengerFare,
      },
    };
  }

  /**
   * Austin: Find nearby stops using H3 spatial index.
   */
  async findNearbyStops(
    lat: number,
    lng: number,
    radiusMeters?: number,
    limit?: number,
  ): Promise<NearbyStopsResponseDto> {
    const radius = radiusMeters || 500;
    const maxResults = limit || 10;

    // Use GTFS service for PostGIS-based nearby stops
    const result = await this.gtfsService.getNearbyStops({
      lat,
      lng,
      radius,
      limit: maxResults,
    });

    return {
      stops: result.stops.map((stop: any) => ({
        stopId: stop.stopId,
        name: stop.stopName,
        lat: stop.stopLat,
        lng: stop.stopLon,
        h3Index: stop.h3IndexRes10,
        distanceMeters: stop.distance,
        walkingTimeSeconds: Math.round((stop.distance || 0) / 1.4), // ~1.4 m/s walk speed
      })),
      queryLocation: { lat, lng },
      radiusMeters: radius,
      totalFound: result.count,
    };
  }

  /**
   * Austin: Get booking status returning the new response format.
   */
  async getBookingStatus(bookingId: string): Promise<BookingStatusResponseDto> {
    this.logger.log(`Getting booking status for ${bookingId}`);

    if (!this.temporalService.isAvailable()) {
      throw new BadRequestException('Booking service temporarily unavailable');
    }

    try {
      const currentStatus: BookingStatus = await this.temporalService.queryWorkflow(
        bookingId,
        'getBookingStatus',
      );

      return {
        bookingId,
        status: currentStatus,
      };
    } catch (error: any) {
      if (error.message?.includes('workflow not found')) {
        throw new NotFoundException(`Booking ${bookingId} not found`);
      }

      if (error.message?.includes('workflow execution already started')) {
        return {
          bookingId,
          status: BookingStatus.PENDING,
          message: 'Booking is being processed',
        };
      }

      this.logger.error(`Error getting booking status:`, error);
      return {
        bookingId,
        status: BookingStatus.FAILED,
        message: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Austin: Cancel a booking with reason.
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    this.logger.log(`Cancelling booking ${bookingId}, reason: ${reason || 'Not specified'}`);

    if (!this.temporalService.isAvailable()) {
      throw new BadRequestException('Booking service temporarily unavailable');
    }

    try {
      await this.temporalService.cancelWorkflow(bookingId);
      this.logger.log(`Booking cancelled: ${bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel booking:`, error);
      throw new BadRequestException('Failed to cancel booking');
    }
  }

  // ========================================================================
  // Austin: Helper Methods
  // ========================================================================

  private mapStopToDto(stop: any): StopResponseDto {
    return {
      stopId: stop.stopId,
      name: stop.stopName,
      lat: stop.stopLat,
      lng: stop.stopLon,
      h3Index: stop.h3IndexRes10,
    };
  }

  // ========================================================================
  // Austin: Legacy Booking Methods (kept for backward compatibility)
  // ========================================================================

  /**
   * @deprecated Use createStopToStopBooking instead
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
  async createBooking(request: LegacyBookingRequest) {
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
        status: BookingStatus.PENDING, // Initial status from workflow
        message: 'Your booking is being processed',
      };
    } catch (error) {
      this.logger.error('Failed to start booking workflow:', error);
      throw new BadRequestException('Failed to create booking. Please try again.');
    }
  }

  /**
   * Validate booking request
   */
  private validateBookingRequest(request: LegacyBookingRequest): void {
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
