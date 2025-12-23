// ============================================================================
// Booking Internal Controller
// ============================================================================
// Internal endpoints called by Temporal workers
// Protected with Internal Service Guard

import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InternalServiceGuard } from '../../shared/guards/internal-service.guard';
import { BookingInternalService } from '../services/booking-internal.service';

@ApiTags('Internal - Booking')
@Controller('api/v1/booking/internal')
@UseGuards(InternalServiceGuard)
export class BookingInternalController {
  constructor(private bookingInternalService: BookingInternalService) {}

  @Post('reserve-seat')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: '[INTERNAL] Reserve seat for booking' })
  @ApiResponse({ status: 200, description: 'Seat reserved successfully' })
  @ApiResponse({ status: 400, description: 'Seat not available' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid service key' })
  async reserveSeat(
    @Body()
    data: {
      userId: string;
      vehicleId?: string;
      seatId?: string;
    },
  ) {
    return await this.bookingInternalService.reserveSeat(data);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: '[INTERNAL] Confirm booking after payment' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  async confirmBooking(
    @Body()
    data: {
      reservationId: string;
      paymentId: string;
      vehicleId: string;
      seatId: string;
    },
  ) {
    return await this.bookingInternalService.confirmBooking(data);
  }

  @Delete('reserve/:reservationId')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: '[INTERNAL] Release seat reservation (compensation)' })
  @ApiResponse({ status: 200, description: 'Reservation released successfully' })
  async releaseReservation(@Param('reservationId') reservationId: string) {
    await this.bookingInternalService.releaseReservation(reservationId);
    return {
      success: true,
      reservationId,
      message: 'Reservation released successfully',
      releasedAt: new Date(),
    };
  }
}
