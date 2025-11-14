// ============================================================================
// Booking Activities for Temporal Workflows
// ============================================================================
// These activities represent the atomic operations in the booking process.
// In production, these will make HTTP/gRPC calls to the actual services.

import axios from 'axios';
import {
  BookingRequest,
  Reservation,
  PaymentDetails,
  BookingConfirmation,
  DriverNotification,
  NotificationPayload,
} from '../interfaces';

// Get service URLs from environment variables
const NESTJS_API_URL = process.env.NESTJS_API_URL || 'http://localhost:3000';
const SPRINGBOOT_API_URL = process.env.SPRINGBOOT_API_URL || 'http://localhost:8080';

/**
 * Activity: Reserve a seat for the booking
 * 
 * This activity communicates with the Booking domain in NestJS
 * to create a temporary reservation.
 * 
 * @param request - The booking request details
 * @returns Reservation details with expiration time
 */
export async function reserveSeat(request: BookingRequest): Promise<Reservation> {
  console.log(`[ACTIVITY] Reserving seat for user ${request.userId}`);
  console.log(`[ACTIVITY] Route: ${JSON.stringify(request.startLocation)} -> ${JSON.stringify(request.endLocation)}`);

  try {
    // In production, this would call the NestJS Booking API
    // const response = await axios.post(`${NESTJS_API_URL}/api/v1/booking/reserve`, request);
    // return response.data;

    // Placeholder implementation
    const reservation: Reservation = {
      reservationId: `res-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      seatId: `seat-${Math.floor(Math.random() * 50) + 1}A`,
      vehicleId: `bus-${Math.floor(Math.random() * 10) + 1}`.padStart(3, '0'),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    console.log(`[ACTIVITY] Seat reserved: ${reservation.reservationId} on vehicle ${reservation.vehicleId}`);
    return reservation;
  } catch (error) {
    console.error(`[ACTIVITY] Failed to reserve seat:`, error);
    throw new Error(`Seat reservation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Activity: Process payment through Paystack
 * 
 * This activity communicates with the Payment domain in Spring Boot
 * which integrates with Paystack for payment processing.
 * 
 * @param reservation - The reservation to charge for
 * @returns Payment details with status
 */
export async function processPayment(reservation: Reservation): Promise<PaymentDetails> {
  console.log(`[ACTIVITY] Processing payment for reservation ${reservation.reservationId}`);

  try {
    // In production, this would call the Spring Boot Payment API
    // const response = await axios.post(`${SPRINGBOOT_API_URL}/api/v1/payment/process`, {
    //   reservationId: reservation.reservationId,
    //   amount: calculateFare(reservation),
    //   currency: 'GHS',
    // });
    // return response.data;

    // Placeholder implementation with random success/failure for testing
    const shouldSucceed = Math.random() > 0.1; // 90% success rate

    if (!shouldSucceed) {
      const failedPayment: PaymentDetails = {
        paymentId: `pay-failed-${Date.now()}`,
        status: 'FAILED',
        amount: 50.0,
        currency: 'GHS',
        failureReason: 'Insufficient funds',
      };
      console.error(`[ACTIVITY] Payment failed: ${failedPayment.failureReason}`);
      return failedPayment;
    }

    const payment: PaymentDetails = {
      paymentId: `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      status: 'SUCCESS',
      amount: 50.0, // Base fare in GHS
      currency: 'GHS',
      paystackReference: `PSTK-${Date.now()}`,
    };

    console.log(`[ACTIVITY] Payment successful: ${payment.paymentId} (${payment.amount} ${payment.currency})`);
    return payment;
  } catch (error) {
    console.error(`[ACTIVITY] Payment processing error:`, error);
    throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Activity: Confirm the booking after payment
 * 
 * This activity finalizes the booking in the Booking domain
 * and assigns a driver through the Fleet Operations domain.
 * 
 * @param reservation - The seat reservation
 * @param payment - The successful payment
 * @returns Confirmed booking details
 */
export async function confirmBooking(
  reservation: Reservation,
  payment: PaymentDetails
): Promise<BookingConfirmation> {
  console.log(`[ACTIVITY] Confirming booking for reservation ${reservation.reservationId}`);

  try {
    // In production, this would call the NestJS Booking API
    // const response = await axios.post(`${NESTJS_API_URL}/api/v1/booking/confirm`, {
    //   reservationId: reservation.reservationId,
    //   paymentId: payment.paymentId,
    // });
    // return response.data;

    // Placeholder implementation
    const booking: BookingConfirmation = {
      bookingId: `book-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      status: 'CONFIRMED',
      vehicleId: reservation.vehicleId,
      driverId: `driver-${Math.floor(Math.random() * 100) + 1}`,
      estimatedArrivalTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      fare: payment.amount,
    };

    console.log(`[ACTIVITY] Booking confirmed: ${booking.bookingId} with driver ${booking.driverId}`);
    return booking;
  } catch (error) {
    console.error(`[ACTIVITY] Booking confirmation error:`, error);
    throw new Error(`Booking confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Activity: Notify the driver about the new booking
 * 
 * This activity sends a notification to the assigned driver
 * through the Telematics domain's notification system.
 * 
 * @param notification - Driver notification details
 */
export async function notifyDriver(notification: DriverNotification): Promise<void> {
  console.log(`[ACTIVITY] Notifying driver ${notification.driverId} about booking ${notification.bookingId}`);

  try {
    // In production, this would call the NestJS Telematics API
    // await axios.post(`${NESTJS_API_URL}/api/v1/telematics/notify-driver`, notification);

    // Placeholder implementation
    console.log(`[ACTIVITY] Driver notification sent successfully`);
    console.log(`[ACTIVITY] Pickup: ${notification.pickupLocation.address || 'Unknown'}`);
    console.log(`[ACTIVITY] Dropoff: ${notification.dropoffLocation.address || 'Unknown'}`);
  } catch (error) {
    console.error(`[ACTIVITY] Driver notification error:`, error);
    // Don't throw - notification failures shouldn't fail the workflow
    console.warn(`[ACTIVITY] Continuing despite notification failure`);
  }
}

/**
 * Activity: Send notification to passenger
 * 
 * This activity sends SMS, email, or push notification to the passenger
 * confirming their booking.
 * 
 * @param notification - Notification payload
 */
export async function sendNotification(notification: NotificationPayload): Promise<void> {
  console.log(`[ACTIVITY] Sending ${notification.type} notification to user ${notification.userId}`);

  try {
    // In production, this would call the NestJS notification service
    // await axios.post(`${NESTJS_API_URL}/api/v1/notifications/send`, notification);

    // Placeholder implementation
    console.log(`[ACTIVITY] ${notification.type} notification sent: ${notification.message}`);
  } catch (error) {
    console.error(`[ACTIVITY] Notification sending error:`, error);
    // Don't throw - notification failures shouldn't fail the workflow
    console.warn(`[ACTIVITY] Continuing despite notification failure`);
  }
}

/**
 * Compensation Activity: Release seat reservation
 * 
 * This is a Saga compensation activity that runs if the workflow fails
 * after a seat has been reserved. It releases the seat back to inventory.
 * 
 * @param reservation - The reservation to release
 */
export async function releaseSeatReservation(reservation: Reservation): Promise<void> {
  console.log(`[COMPENSATION] Releasing seat reservation ${reservation.reservationId}`);

  try {
    // In production, this would call the NestJS Booking API
    // await axios.delete(`${NESTJS_API_URL}/api/v1/booking/reserve/${reservation.reservationId}`);

    // Placeholder implementation
    console.log(`[COMPENSATION] Seat ${reservation.seatId} on vehicle ${reservation.vehicleId} released successfully`);
  } catch (error) {
    console.error(`[COMPENSATION] Failed to release seat reservation:`, error);
    // Log but don't throw - we want compensation to be best-effort
    console.error(`[COMPENSATION] Manual intervention may be required for reservation ${reservation.reservationId}`);
  }
}

/**
 * Compensation Activity: Refund payment
 * 
 * This is a Saga compensation activity that runs if the workflow fails
 * after payment has been processed. It initiates a refund through Paystack.
 * 
 * @param payment - The payment to refund
 */
export async function refundPayment(payment: PaymentDetails): Promise<void> {
  console.log(`[COMPENSATION] Refunding payment ${payment.paymentId}`);

  try {
    // In production, this would call the Spring Boot Payment API
    // await axios.post(`${SPRINGBOOT_API_URL}/api/v1/payment/refund`, {
    //   paymentId: payment.paymentId,
    //   amount: payment.amount,
    //   reason: 'Booking failed',
    // });

    // Placeholder implementation
    console.log(`[COMPENSATION] Refund initiated for ${payment.amount} ${payment.currency}`);
    console.log(`[COMPENSATION] Paystack reference: ${payment.paystackReference}`);
  } catch (error) {
    console.error(`[COMPENSATION] Failed to refund payment:`, error);
    // Log but don't throw - we want compensation to be best-effort
    console.error(`[COMPENSATION] Manual refund required for payment ${payment.paymentId}`);
  }
}
