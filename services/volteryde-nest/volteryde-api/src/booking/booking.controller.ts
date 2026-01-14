// ============================================================================
// Booking Controller for NestJS - Stop-to-Stop Model
// ============================================================================
// Austin: This controller handles stop-to-stop booking operations.
// Users book rides between predefined stops. Walking is user's responsibility.

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  FareEstimateQueryDto,
  NearbyStopsQueryDto,
  CancelBookingDto,
} from './dto/booking-request.dto';
import {
  BookingConfirmationDto,
  BookingStatusResponseDto,
  FareEstimateResponseDto,
  NearbyStopsResponseDto,
} from './dto/booking-response.dto';

@ApiTags('booking')
@Controller('api/v1/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ========================================================================
  // Austin: Core Booking Operations
  // ========================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new stop-to-stop ride booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingConfirmationDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request - stops not found or same stop' })
  async createBooking(@Body() request: CreateBookingDto): Promise<BookingConfirmationDto> {
    return this.bookingService.createStopToStopBooking(request);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get booking status by ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking status retrieved',
    type: BookingStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingStatus(
    @Param('bookingId') bookingId: string,
  ): Promise<BookingStatusResponseDto> {
    return this.bookingService.getBookingStatus(bookingId);
  }

  @Delete(':bookingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 204, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel - booking already in progress' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelDto: CancelBookingDto,
  ): Promise<void> {
    await this.bookingService.cancelBooking(bookingId, cancelDto.reason);
  }

  // ========================================================================
  // Austin: Fare & Route Estimation Endpoints
  // ========================================================================

  @Get('estimate/fare')
  @ApiOperation({ summary: 'Get fare estimate between two stops' })
  @ApiResponse({
    status: 200,
    description: 'Fare estimate calculated',
    type: FareEstimateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid stops or same stop provided' })
  @ApiResponse({ status: 404, description: 'One or both stops not found' })
  async getFareEstimate(
    @Query() query: FareEstimateQueryDto,
  ): Promise<FareEstimateResponseDto> {
    return this.bookingService.getFareEstimate(
      query.pickupStopId,
      query.dropoffStopId,
      query.passengerCount,
    );
  }

  // ========================================================================
  // Austin: Stop Discovery Endpoints
  // ========================================================================

  @Get('stops/nearby')
  @ApiOperation({ summary: 'Find nearby stops by GPS coordinates' })
  @ApiResponse({
    status: 200,
    description: 'Nearby stops found',
    type: NearbyStopsResponseDto,
  })
  @ApiQuery({ name: 'lat', type: Number, required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', type: Number, required: true, description: 'Longitude' })
  @ApiQuery({ name: 'radiusMeters', type: Number, required: false, description: 'Search radius (default: 500m)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Max results (default: 10)' })
  async getNearbyStops(
    @Query() query: NearbyStopsQueryDto,
  ): Promise<NearbyStopsResponseDto> {
    return this.bookingService.findNearbyStops(
      query.lat,
      query.lng,
      query.radiusMeters,
      query.limit,
    );
  }
}
