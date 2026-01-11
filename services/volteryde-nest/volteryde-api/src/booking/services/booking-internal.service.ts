// ============================================================================
// Booking Internal Service
// ============================================================================
// Service for internal booking operations called by Temporal activities

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Reservation } from '../entities/reservation.entity';
import { BookingStatus } from '../../../../libs/shared/src/enums/booking-status.enum';
import { GtfsService } from '../../gtfs/services/gtfs.service';

@Injectable()
export class BookingInternalService {
  private readonly logger = new Logger(BookingInternalService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private gtfsService: GtfsService,
  ) { }

  async reserveSeat(data: {
    userId: string;
    tripId: string;
    fromStopId: string;
    toStopId: string;
    vehicleId?: string;
    seatId?: string;
  }): Promise<Reservation> {
    this.logger.log(`Reserving seat for user ${data.userId} on trip ${data.tripId}`);

    // Call GTFS Service to reserve segments
    // This handles inventory check and locking
    const segmentReservations = await this.gtfsService.reserveSegments(
      data.tripId,
      data.fromStopId,
      data.toStopId,
      `TEMP-${Date.now()}`, // Temp booking ID until confirmed
      data.userId
    );

    // For backward compatibility with current mock, verify at least one reservation returned
    if (!segmentReservations || segmentReservations.length === 0) {
      throw new Error('Failed to reserve segments');
    }

    // Return the first segment reservation as a proxy for the whole journey
    // In a real scenario, we'd return a JourneyReservation object wrapping all segments
    const primaryReservation = segmentReservations[0];

    // Creates a legacy reservation record for compatibility (optional, depending on architecture)
    const reservation = this.reservationRepository.create({
      userId: data.userId,
      vehicleId: data.vehicleId || 'ASSIGNED-BY-FLEET',
      seatId: data.seatId || 'ANY',
      expiresAt: primaryReservation.expiresAt,
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
