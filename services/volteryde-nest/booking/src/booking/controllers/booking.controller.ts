import { Controller, Post, Get, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { SearchRideDto } from '../dto/search-ride.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';

@ApiTags('booking')
@Controller('api/v1/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Get('search')
  @ApiOperation({ summary: 'Search for available rides' })
  @ApiResponse({ status: 200, description: 'List of available ride options' })
  async searchRides(@Query() query: SearchRideDto) {
    return this.bookingService.searchRides(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ride booking' })
  @ApiResponse({ status: 201, description: 'Booking workflow started', type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createBooking(@Body() request: CreateBookingDto) {
    return this.bookingService.createBooking(request);
  }

  @Get(':workflowId')
  @ApiOperation({ summary: 'Get booking status' })
  @ApiResponse({ status: 200, description: 'Booking status retrieved', type: BookingResponseDto })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingStatus(@Param('workflowId') workflowId: string) {
    return this.bookingService.getBookingStatus(workflowId);
  }

  @Get(':workflowId/track')
  @ApiOperation({ summary: 'Track booking (Status + Bus Info)' })
  @ApiResponse({ status: 200, description: 'Booking tracking details with bus info' })
  async trackBooking(@Param('workflowId') workflowId: string) {
    return this.bookingService.trackBooking(workflowId);
  }

  @Get(':workflowId/driver')
  @ApiOperation({ summary: 'Get bus driver details for a booking' })
  @ApiResponse({ status: 200, description: 'Driver and bus details' })
  @ApiResponse({ status: 400, description: 'Driver details only available for active bookings' })
  async getDriverDetails(@Param('workflowId') workflowId: string) {
    return this.bookingService.getDriverDetails(workflowId);
  }

  @Delete(':workflowId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 204, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Failed to cancel' })
  async cancelBooking(@Param('workflowId') workflowId: string) {
    await this.bookingService.cancelBooking(workflowId);
  }
}
