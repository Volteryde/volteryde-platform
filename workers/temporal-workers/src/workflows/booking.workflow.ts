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
  WalletBalance,
  WalletTransaction,
} from '../interfaces';
import { BookingStatus } from '../interfaces';

// ============================================================================
// Activity Proxies
// ============================================================================
// These proxies allow the workflow to call activities with retry policies

const {
  reserveSeat,
  checkWalletBalance,
  deductFare,
  confirmBooking,
  notifyDriver,
  sendNotification,
  releaseSeatReservation,
  refundWalletDeduction,
  updateBookingStatus,
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
 * 1. Check wallet balance
 * 2. Reserve a seat on a vehicle
 * 3. Deduct fare from wallet
 * 4. Confirm the booking and assign a driver
 * 5. Notify the driver and passenger
 * 
 * If any step fails after deduction, the workflow runs compensation logic (Saga pattern):
 * - Refunds the wallet deduction
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
  let transaction: WalletTransaction | null = null;
  let bookingStatus: BookingStatus = BookingStatus.PENDING;
  let bookingId: string | null = null; // To store bookingId once available
  const RIDE_FARE = 12;

  try {
    // ========================================================================
    // Step 1: Check Wallet Balance
    // ========================================================================
    console.log(`[WORKFLOW] Step 1: Checking wallet balance...`);
    const walletStatus: WalletBalance = await checkWalletBalance(request.userId, RIDE_FARE);

    if (!walletStatus.hasSufficientFunds) {
      throw new Error(`Insufficient funds. Required ${RIDE_FARE} ${walletStatus.currency}, available ${walletStatus.balance}`);
    }

    // ========================================================================
    // Step 2: Reserve Seat
    // ========================================================================
    console.log(`[WORKFLOW] Step 2: Reserving seat...`);
    reservation = await reserveSeat(request);
    if (!reservation) {
      throw new Error('Seat reservation failed: no reservation returned');
    }
    bookingStatus = BookingStatus.PENDING; // Still pending until confirmed
    // We don't have a bookingId yet, so we can't update status in DB
    console.log(`[WORKFLOW] Seat reserved: ${reservation.reservationId}`);

    // Small delay to simulate real-world timing
    await sleep('1 second');

    // ========================================================================
    // Step 3: Deduct Fare
    // ========================================================================
    console.log(`[WORKFLOW] Step 3: Deducting fare from wallet...`);
    transaction = await deductFare(request.userId, RIDE_FARE, reservation.reservationId);

    if (!transaction || transaction.status !== 'SUCCESS') {
      throw new Error(`Wallet deduction failed: ${transaction ? transaction.failureReason || 'Unknown reason' : 'No response'}`);
    }



    // ========================================================================
    // Step 4: Confirm Booking
    // ========================================================================
    console.log(`[WORKFLOW] Step 4: Confirming booking...`);

    const paymentDetails: PaymentDetails = {
      paymentId: transaction.transactionId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
    };

    const booking = await confirmBooking(reservation, paymentDetails);
    bookingId = booking.bookingId;
    bookingStatus = BookingStatus.IN_PROGRESS; // Booking is now in progress
    await updateBookingStatus(bookingId, bookingStatus); // Update DB
    console.log(`[WORKFLOW] Booking confirmed: ${booking.bookingId}`);

    // ========================================================================
    // Step 5: Send Notifications (Non-blocking)
    // ========================================================================
    // We run notifications in a non-cancellable scope so they complete
    // even if the workflow is cancelled or times out
    console.log(`[WORKFLOW] Step 5: Sending notifications...`);

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
    bookingStatus = BookingStatus.COMPLETED;
    if (bookingId) {
      await updateBookingStatus(bookingId, bookingStatus); // Update DB
    }
    console.log(`[WORKFLOW] Booking workflow completed successfully: ${booking.bookingId}`);
    return booking;

  } catch (error) {
    // ========================================================================
    // Error Handling & Saga Compensation
    // ========================================================================
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WORKFLOW] Booking workflow failed: ${errorMessage}`);

    bookingStatus = BookingStatus.FAILED;
    if (bookingId) {
      await updateBookingStatus(bookingId, bookingStatus); // Update DB
    }

    // Run compensation logic if needed
    if (transaction && transaction.status === 'SUCCESS') {
      console.log(`[WORKFLOW] Running Saga compensation...`);

      // Use non-cancellable scope to ensure compensation runs
      // even if workflow is being cancelled
      await CancellationScope.nonCancellable(async () => {
        // Compensate in reverse order
        
        // 1. Refund wallet deduction
        if (transaction) {
          console.log(`[WORKFLOW] Compensating: Refunding wallet transaction ${transaction.transactionId}`);
          try {
            await refundWalletDeduction(transaction);
            console.log(`[WORKFLOW] Wallet refund successful`);
          } catch (refundError) {
            console.error(`[WORKFLOW] Failed to refund wallet:`, refundError);
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
            message: `We're sorry, but your booking could not be completed. ${transaction ? 'Your wallet has been refunded.' : ''}`,
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
    } else if (reservation) {
      // No wallet deduction happened, but release seat if reserved
      console.log(`[WORKFLOW] No wallet deduction occurred. Releasing seat reservation if present.`);
      await CancellationScope.nonCancellable(async () => {
        try {
          await releaseSeatReservation(reservation!);
          console.log(`[WORKFLOW] Seat reservation released successfully`);
        } catch (releaseError) {
          console.error(`[WORKFLOW] Failed to release reservation:`, releaseError);
        }
      });
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
 * Note: This requires the status to be tracked in a workflow-scoped variable
 */
export function getBookingStatus(): BookingStatus {
  // This is a placeholder - in the actual implementation,
  // you would need to maintain a workflow-level state variable
  // that can be accessed by this query function
  return BookingStatus.PENDING;
}
