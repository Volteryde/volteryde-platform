// ============================================================================
// Booking Internal Service
// ============================================================================
// Service for internal booking operations called by Temporal activities

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Reservation } from '../entities/reservation.entity';
import { BookingStatus } from '../../../../../packages/shared-types/src/booking-status.enum';

@Injectable()
export class BookingInternalService {
  private readonly logger = new Logger(BookingInternalService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  async reserveSeat(data: {
    userId: string;
    vehicleId?: string;
    seatId?: string;
  }): Promise<Reservation> {
    this.logger.log(`Reserving seat for user ${data.userId}`);
    const reservation = this.reservationRepository.create({
      userId: data.userId,
      vehicleId: data.vehicleId,
      seatId: data.seatId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      status: 'RESERVED',
    });
    return await this.reservationRepository.save(reservation);
  }

  async confirmBooking(data: {
    reservationId: string;
    paymentId: string;
    vehicleId: string;
    seatId: string;
  }): Promise<Booking> {
    this.logger.log(`Confirming booking for reservation ${data.reservationId}`);
    const reservation = await this.reservationRepository.findOne({ where: { id: data.reservationId } });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${data.reservationId} not found`);
    }

    const booking = this.bookingRepository.create({
      reservationId: data.reservationId,
      paymentId: data.paymentId,
      vehicleId: data.vehicleId,
      seatId: data.seatId,
      userId: reservation.userId,
      status: BookingStatus.CONFIRMED, // Use enum
      fare: 50.0, // Placeholder
    });
    return await this.bookingRepository.save(booking);
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
    this.logger.log(`Updating status for booking ${bookingId} to ${status}`);
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }
    booking.status = status;
    return await this.bookingRepository.save(booking);
  }

  async releaseReservation(reservationId: string): Promise<void> {
    this.logger.log(`Releasing reservation ${reservationId}`);
    const reservation = await this.reservationRepository.findOne({ where: { id: reservationId } });
    if (reservation) {
      reservation.status = 'CANCELLED';
      await this.reservationRepository.save(reservation);
    }
  }
}
