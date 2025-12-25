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
  WalletBalance,
  WalletTransaction,
  BookingStatus,
} from '../interfaces';

// Get service URLs from environment variables
// In Kubernetes: http://service-name.namespace.svc.cluster.local
// In Docker Compose: http://service-name
// In Local Dev: http://localhost:PORT
const NESTJS_API_URL = process.env.NESTJS_API_URL || 'http://localhost:3000';
const SPRINGBOOT_API_URL = process.env.SPRINGBOOT_API_URL || 'http://localhost:8080';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'dev-internal-key';

/**
 * Activity: Update the status of a booking
 * 
 * This activity communicates with the Booking domain in NestJS
 * to update the status of a specific booking.
 * 
 * @param bookingId - The ID of the booking to update
 * @param status - The new status for the booking
 */
export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  console.log(`[ACTIVITY] Updating status for booking ${bookingId} to ${status}`);

  try {
    await axios.patch(
      `${NESTJS_API_URL}/api/v1/booking/internal/${bookingId}/status`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );
    console.log(`[ACTIVITY] Booking ${bookingId} status updated to ${status}`);
  } catch (error) {
    console.error(`[ACTIVITY] Failed to update status for booking ${bookingId} to ${status}:`, error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to update booking status: ${message}`);
    }
    throw new Error(`Failed to update booking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Activity: Check if user has sufficient wallet balance
 * 
 * This activity communicates with the Payment/Wallet domain in Spring Boot
 * to check the user's current wallet balance.
 * 
 * @param userId - The ID of the user
 * @param requiredAmount - The amount required for the booking
 * @returns Wallet balance status
 */
export async function checkWalletBalance(userId: string, requiredAmount: number): Promise<WalletBalance> {
  console.log(`[ACTIVITY] Checking wallet balance for user ${userId}. Required: ${requiredAmount}`);

  try {
    // Call the Spring Boot Wallet API to get balance
    // Assuming endpoint: GET /api/v1/wallet/{userId}/balance
    const response = await axios.get(
      `${SPRINGBOOT_API_URL}/api/v1/wallet/${userId}/balance`,
      {
        headers: {
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );

    const data = response.data;
    // Assuming response structure: { balance: number, currency: string }
    
    const balance = typeof data === 'number' ? data : data.balance;
    const currency = data.currency || 'GHS';

    const hasSufficientFunds = balance >= requiredAmount;

    console.log(`[ACTIVITY] User ${userId} balance: ${balance} ${currency}. Sufficient: ${hasSufficientFunds}`);

    return {
      userId,
      balance,
      currency,
      hasSufficientFunds,
    };
  } catch (error) {
    console.error(`[ACTIVITY] Failed to check wallet balance:`, error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      // If 404, maybe wallet doesn't exist, treat as 0 balance
      if (error.response?.status === 404) {
        return {
            userId,
            balance: 0,
            currency: 'GHS',
            hasSufficientFunds: false
        };
      }
      throw new Error(`Wallet balance check failed: ${message}`);
    }
    throw new Error(`Wallet balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Activity: Deduct fare from user's wallet
 * 
 * This activity communicates with the Payment/Wallet domain in Spring Boot
 * to deduct the fare amount from the user's wallet.
 * 
 * @param userId - The ID of the user
 * @param amount - The amount to deduct
 * @param bookingId - The booking ID (for reference)
 * @returns Transaction details
 */
export async function deductFare(userId: string, amount: number, bookingId: string): Promise<WalletTransaction> {
  console.log(`[ACTIVITY] Deducting ${amount} from user ${userId} wallet for booking ${bookingId}`);

  try {
    // Call the Spring Boot Wallet API to deduct funds
    // Assuming endpoint: POST /api/v1/wallet/deduct
    const response = await axios.post(
      `${SPRINGBOOT_API_URL}/api/v1/wallet/deduct`,
      {
        userId,
        amount,
        currency: 'GHS',
        referenceId: bookingId,
        reason: 'Ride Booking Fare',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 10000,
      }
    );

    const transaction: WalletTransaction = response.data;
    
    if (transaction.status === 'SUCCESS') {
      console.log(`[ACTIVITY] Wallet deduction successful: ${transaction.transactionId}`);
    } else {
      console.error(`[ACTIVITY] Wallet deduction failed: ${transaction.failureReason}`);
    }
    
    return transaction;
  } catch (error) {
    console.error(`[ACTIVITY] Wallet deduction error:`, error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Wallet deduction failed: ${message}`);
    }
    throw new Error(`Wallet deduction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Activity: Refund partial wallet deduction (Cancellation Penalty Logic)
 *
 * This activity refunds a specific amount to the user's wallet.
 *
 * @param transaction - The original wallet transaction
 * @param amount - The amount to refund
 */
export async function refundPartialWalletDeduction(transaction: WalletTransaction, amount: number): Promise<void> {
  console.log(`[ACTIVITY] Refunding partial amount ${amount} for transaction ${transaction.transactionId}`);

  try {
    // Call the Spring Boot Wallet API to refund funds
    // Using new endpoint: POST /api/v1/wallet/refund
    await axios.post(
      `${SPRINGBOOT_API_URL}/api/v1/wallet/refund`,
      {
        userId: transaction.userId,
        amount,
        currency: transaction.currency,
        originalReferenceId: transaction.transactionId,
        reason: 'Cancellation Refund (Partial)',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 10000,
      }
    );

    console.log(`[ACTIVITY] Wallet partial refund successful: ${amount}`);
  } catch (error) {
    console.error(`[ACTIVITY] Wallet partial refund failed:`, error);
    throw new Error(`Wallet partial refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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
    // Call the NestJS Booking API to reserve a seat
    const response = await axios.post(
      `${NESTJS_API_URL}/api/v1/booking/internal/reserve-seat`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const reservation: Reservation = response.data;
    console.log(`[ACTIVITY] Seat reserved: ${reservation.reservationId} on vehicle ${reservation.vehicleId}`);
    return reservation;
  } catch (error) {
    console.error(`[ACTIVITY] Failed to reserve seat:`, error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Seat reservation failed: ${message}`);
    }
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
    // Call the Spring Boot Payment API to process payment via Paystack
    const response = await axios.post(
      `${SPRINGBOOT_API_URL}/api/v1/payment/process`,
      {
        reservationId: reservation.reservationId,
        vehicleId: reservation.vehicleId,
        seatId: reservation.seatId,
        amount: 50.0, // Calculate fare based on route
        currency: 'GHS',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 30000, // 30 second timeout (payment can take time)
      }
    );

    const payment: PaymentDetails = response.data;
    
    if (payment.status === 'SUCCESS') {
      console.log(`[ACTIVITY] Payment successful: ${payment.paymentId} (${payment.amount} ${payment.currency})`);
    } else {
      console.error(`[ACTIVITY] Payment failed: ${payment.failureReason}`);
    }
    
    return payment;
  } catch (error) {
    console.error(`[ACTIVITY] Payment processing error:`, error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Payment failed: ${message}`);
    }
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
    // Call the NestJS Booking API to confirm and assign driver
    const response = await axios.post(
      `${NESTJS_API_URL}/api/v1/booking/internal/confirm`,
      {
        reservationId: reservation.reservationId,
        paymentId: payment.paymentId,
        vehicleId: reservation.vehicleId,
        seatId: reservation.seatId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 15000, // 15 second timeout
      }
    );

    const booking: BookingConfirmation = response.data;
    console.log(`[ACTIVITY] Booking confirmed: ${booking.bookingId} with driver ${booking.driverId}`);
    return booking;
  } catch (error) {
    console.error(`[ACTIVITY] Booking confirmation error:`, error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Booking confirmation failed: ${message}`);
    }
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
    // Call the NestJS API to send driver notification
    await axios.post(
      `${NESTJS_API_URL}/api/v1/notifications/internal/driver`,
      notification,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );

    console.log(`[ACTIVITY] Driver notification sent successfully`);
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
    // Call the NestJS notification service to send notification
    await axios.post(
      `${NESTJS_API_URL}/api/v1/notifications/internal/send`,
      notification,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );

    console.log(`[ACTIVITY] ${notification.type} notification sent: ${notification.message}`);
  } catch (error) {
    console.error(`[ACTIVITY] Notification sending error:`, error);
    // Don't throw - notification failures shouldn't fail the workflow
    console.warn(`[ACTIVITY] Continuing despite notification failure`);
  }
}

/**
 * Compensation Activity: Refund wallet deduction
 *
 * This activity credits the user's wallet if the booking workflow fails
 * after funds have already been deducted.
 *
 * @param transaction - The wallet transaction to refund
 */
export async function refundWalletDeduction(transaction: WalletTransaction): Promise<void> {
  console.log(`[COMPENSATION] Refunding wallet transaction ${transaction.transactionId}`);

  try {
    await axios.post(
      `${SPRINGBOOT_API_URL}/api/v1/wallet/credit`,
      {
        userId: transaction.userId,
        amount: transaction.amount,
        currency: transaction.currency,
        referenceId: `REFUND-${transaction.transactionId}`,
        reason: 'Booking failed - wallet refund',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 10000,
      }
    );

    console.log(`[COMPENSATION] Wallet refund completed for user ${transaction.userId}`);
  } catch (error) {
    console.error(`[COMPENSATION] Failed to refund wallet transaction:`, error);
    console.error(`[COMPENSATION] Manual refund may be required for transaction ${transaction.transactionId}`);
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
    // Call the NestJS Booking API to release the reservation
    await axios.delete(
      `${NESTJS_API_URL}/api/v1/booking/internal/reserve/${reservation.reservationId}`,
      {
        headers: {
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 10000,
      }
    );

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
    // Call the Spring Boot Payment API to process refund via Paystack
    await axios.post(
      `${SPRINGBOOT_API_URL}/api/v1/payment/refund`,
      {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        reason: 'Booking failed - compensation',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 30000, // 30 second timeout (refunds can take time)
      }
    );

    console.log(`[COMPENSATION] Refund initiated for ${payment.amount} ${payment.currency}`);
    console.log(`[COMPENSATION] Paystack reference: ${payment.paystackReference}`);
  } catch (error) {
    console.error(`[COMPENSATION] Failed to refund payment:`, error);
    // Log but don't throw - we want compensation to be best-effort
    console.error(`[COMPENSATION] Manual refund required for payment ${payment.paymentId}`);
  }
}
