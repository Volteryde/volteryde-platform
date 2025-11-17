// ============================================================================
// Booking Workflow for Volteryde Platform
// ============================================================================
// This workflow implements the complete booking process with Saga pattern
// for compensation. It is durable and fault-tolerant.

import { 
  proxyActivities, 
  CancellationScope,
  sleep,
  WorkflowInfo,
  workflowInfo,
} from '@temporalio/workflow';

// Import only the types, not the implementations
import type * as activities from '../activities/booking.activities';
import type {
  BookingRequest,
  BookingConfirmation,
  Reservation,
  PaymentDetails,
  DriverNotification,
  NotificationPayload,
} from '../interfaces';
import { BookingStatus } from '../../../../packages/shared-types/src/booking-status.enum';

// ============================================================================
// Activity Proxies
// ============================================================================
// These proxies allow the workflow to call activities with retry policies

const {
  reserveSeat,
  processPayment,
  confirmBooking,
  notifyDriver,
  sendNotification,
  releaseSeatReservation,
  refundPayment,
  updateBookingStatus, // Import the new activity
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds', // Max time for a single activity attempt
  retry: {
    initialInterval: '1 second',
    maximumInterval: '10 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 3, // Retry up to 3 times
  },
});

// ============================================================================
// Main Booking Workflow
// ============================================================================

/**
 * Book Ride Workflow
 * 
 * This is the main workflow for processing a ride booking in the Volteryde platform.
 * It orchestrates the following steps:
 * 
 * 1. Reserve a seat on a vehicle
 * 2. Process payment through Paystack
 * 3. Confirm the booking and assign a driver
 * 4. Notify the driver and passenger
 * 
 * If any step fails after payment, the workflow runs compensation logic (Saga pattern):
 * - Refunds the payment
 * - Releases the seat reservation
 * - Notifies the user of the failure
 * 
 * @param request - The booking request from the user
 * @returns Confirmed booking details
 * @throws Error if the booking cannot be completed
 */
export async function bookRideWorkflow(request: BookingRequest): Promise<BookingConfirmation> {
  const info: WorkflowInfo = workflowInfo();
  console.log(`[WORKFLOW] Starting booking workflow ${info.workflowId} for user ${request.userId}`);

  let reservation: Reservation | null = null;
  let payment: PaymentDetails | null = null;
  let shouldCompensate = false;
  let currentStatus: BookingStatus = BookingStatus.PENDING;
  let bookingId: string | null = null; // To store bookingId once available

  try {
    // ========================================================================
    // Step 1: Reserve Seat
    // ========================================================================
    console.log(`[WORKFLOW] Step 1: Reserving seat...`);
    reservation = await reserveSeat(request);
    currentStatus = BookingStatus.PENDING; // Still pending until confirmed
    // We don't have a bookingId yet, so we can't update status in DB
    console.log(`[WORKFLOW] Seat reserved: ${reservation.reservationId}`);

    // Small delay to simulate real-world timing
    await sleep('1 second');

    // ========================================================================
    // Step 2: Process Payment
    // ========================================================================
    console.log(`[WORKFLOW] Step 2: Processing payment...`);
    payment = await processPayment(reservation);

    if (payment.status !== 'SUCCESS') {
      throw new Error(`Payment failed: ${payment.failureReason || 'Unknown reason'}`);
    }

    console.log(`[WORKFLOW] Payment successful: ${payment.paymentId}`);
    currentStatus = BookingStatus.CONFIRMED; // Payment successful, now confirmed

    // After successful payment, we need to compensate if anything fails
    shouldCompensate = true;

    // ========================================================================
    // Step 3: Confirm Booking
    // ========================================================================
    console.log(`[WORKFLOW] Step 3: Confirming booking...`);
    const booking = await confirmBooking(reservation, payment);
    bookingId = booking.bookingId;
    currentStatus = BookingStatus.IN_PROGRESS; // Booking is now in progress
    await updateBookingStatus(bookingId, currentStatus); // Update DB
    console.log(`[WORKFLOW] Booking confirmed: ${booking.bookingId}`);

    // ========================================================================
    // Step 4: Send Notifications (Non-blocking)
    // ========================================================================
    // We run notifications in a non-cancellable scope so they complete
    // even if the workflow is cancelled or times out
    console.log(`[WORKFLOW] Step 4: Sending notifications...`);

    await CancellationScope.nonCancellable(async () => {
      // Notify driver
      const driverNotification: DriverNotification = {
        driverId: booking.driverId,
        bookingId: booking.bookingId,
        passengerName: `User-${request.userId}`,
        pickupLocation: request.startLocation,
        dropoffLocation: request.endLocation,
      };
      await notifyDriver(driverNotification);

      // Notify passenger
      const passengerNotification: NotificationPayload = {
        userId: request.userId,
        type: 'PUSH',
        subject: 'Booking Confirmed',
        message: `Your ride is confirmed! Driver ${booking.driverId} will arrive at ${booking.estimatedArrivalTime.toISOString()}`,
        metadata: {
          bookingId: booking.bookingId,
          vehicleId: booking.vehicleId,
        },
      };
      await sendNotification(passengerNotification);

      console.log(`[WORKFLOW] Notifications sent successfully`);
    });

    // ========================================================================
    // Success!
    // ========================================================================
    currentStatus = BookingStatus.COMPLETED;
    if (bookingId) {
      await updateBookingStatus(bookingId, currentStatus); // Update DB
    }
    console.log(`[WORKFLOW] Booking workflow completed successfully: ${booking.bookingId}`);
    return booking;

  } catch (error) {
    // ========================================================================
    // Error Handling & Saga Compensation
    // ========================================================================
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WORKFLOW] Booking workflow failed: ${errorMessage}`);

    currentStatus = BookingStatus.FAILED;
    if (bookingId) {
      await updateBookingStatus(bookingId, currentStatus); // Update DB
    }

    // Run compensation logic if needed
    if (shouldCompensate) {
      console.log(`[WORKFLOW] Running Saga compensation...`);

      // Use non-cancellable scope to ensure compensation runs
      // even if workflow is being cancelled
      await CancellationScope.nonCancellable(async () => {
        // Compensate in reverse order
        
        // 1. Refund payment
        if (payment) {
          console.log(`[WORKFLOW] Compensating: Refunding payment ${payment.paymentId}`);
          try {
            await refundPayment(payment);
            console.log(`[WORKFLOW] Payment refunded successfully`);
          } catch (refundError) {
            console.error(`[WORKFLOW] Failed to refund payment:`, refundError);
            // Continue with other compensation steps
          }
        }

        // 2. Release seat reservation
        if (reservation) {
          console.log(`[WORKFLOW] Compensating: Releasing seat ${reservation.reservationId}`);
          try {
            await releaseSeatReservation(reservation);
            console.log(`[WORKFLOW] Seat reservation released successfully`);
          } catch (releaseError) {
            console.error(`[WORKFLOW] Failed to release seat:`, releaseError);
          }
        }

        // 3. Notify user of failure
        try {
          const failureNotification: NotificationPayload = {
            userId: request.userId,
            type: 'PUSH',
            subject: 'Booking Failed',
            message: `We're sorry, but your booking could not be completed. ${payment ? 'Your payment has been refunded.' : ''}`,
            metadata: {
              error: errorMessage,
            },
          };
          await sendNotification(failureNotification);
        } catch (notifyError) {
          console.error(`[WORKFLOW] Failed to send failure notification:`, notifyError);
        }

        console.log(`[WORKFLOW] Saga compensation completed`);
      });
    } else {
      // No compensation needed - failure before payment
      console.log(`[WORKFLOW] No compensation needed - failure occurred before payment`);

      if (reservation) {
        // Still release the reservation if we have one
        await CancellationScope.nonCancellable(async () => {
          try {
            await releaseSeatReservation(reservation!);
          } catch (releaseError) {
            console.error(`[WORKFLOW] Failed to release reservation:`, releaseError);
          }
        });
      }
    }

    // Re-throw the error to mark workflow as failed
    throw new Error(`Booking failed: ${errorMessage}`);
  }
}

// ============================================================================
// Query Handlers (Optional)
// ============================================================================
// These allow external systems to query the workflow state

/**
 * Example query handler to get the current booking status
 * Usage: const status = await handle.query('getBookingStatus');
 */
export function getBookingStatus(): BookingStatus {
  // In a real implementation, you would track state in workflow variables
  return currentStatus;
}
