// ============================================================================
// Booking Controller for NestJS
// ============================================================================

import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingService } from './booking.service';

@ApiTags('booking')
@Controller('api/v1/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ride booking' })
  @ApiResponse({ status: 201, description: 'Booking workflow started' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createBooking(@Body() request: any) {
    return this.bookingService.createBooking(request);
  }

  @Get(':workflowId')
  @ApiOperation({ summary: 'Get booking status' })
  @ApiResponse({ status: 200, description: 'Booking status retrieved' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingStatus(@Param('workflowId') workflowId: string) {
    return this.bookingService.getBookingStatus(workflowId);
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
