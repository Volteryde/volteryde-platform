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
  defineSignal,
  setHandler,
  condition,
} from "@temporalio/workflow";

// Import only the types, not the implementations
import type * as activities from "../activities/booking.activities";
import type {
  BookingRequest,
  BookingConfirmation,
  Reservation,
  PaymentDetails,
  DriverNotification,
  NotificationPayload,
  WalletBalance,
  WalletTransaction,
} from "../interfaces";
import { BookingStatus } from "../interfaces";

// Signals
export const cancelRideSignal =
  defineSignal<[{ reason: string; timestamp: Date }]>("cancelRideSignal");
export const completeRideSignal = defineSignal<[]>("completeRideSignal");

// Activity Proxies
const {
  reserveSeat,
  checkWalletBalance,
  deductFare,
  confirmBooking,
  notifyDriver,
  sendNotification,
  releaseSeatReservation,
  refundWalletDeduction,
  refundPartialWalletDeduction,
  updateBookingStatus,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
  retry: {
    initialInterval: "1 second",
    maximumInterval: "10 seconds",
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export async function bookRideWorkflow(
  request: BookingRequest,
): Promise<BookingConfirmation> {
  const info: WorkflowInfo = workflowInfo();
  console.log(
    `[WORKFLOW] Starting booking workflow ${info.workflowId} for user ${request.userId}`,
  );

  let reservation: Reservation | null = null;
  let transaction: WalletTransaction | null = null;
  let bookingStatus: BookingStatus = BookingStatus.PENDING;
  let bookingId: string | null = null;
  let bookedTime: number | null = null;
  const RIDE_FARE = 12;

  // Signal state
  let rideCancelled = false;
  let rideCompleted = false;
  let cancelReason = "";

  setHandler(cancelRideSignal, (payload) => {
    rideCancelled = true;
    cancelReason = payload.reason;
    console.log(`[WORKFLOW] Cancellation signal received: ${payload.reason}`);
  });

  setHandler(completeRideSignal, () => {
    rideCompleted = true;
    console.log(`[WORKFLOW] Ride completion signal received`);
  });

  try {
    // Step 1: Check Wallet Balance
    console.log(`[WORKFLOW] Step 1: Checking wallet balance...`);
    const walletStatus: WalletBalance = await checkWalletBalance(
      request.userId,
      RIDE_FARE,
    );

    if (!walletStatus.hasSufficientFunds) {
      throw new Error(
        `Insufficient funds. Required ${RIDE_FARE} ${walletStatus.currency}, available ${walletStatus.balance}`,
      );
    }

    // Step 2: Reserve Seat
    console.log(`[WORKFLOW] Step 2: Reserving seat...`);
    reservation = await reserveSeat(request);
    bookingStatus = BookingStatus.PENDING;
    console.log(`[WORKFLOW] Seat reserved: ${reservation.reservationId}`);

    // Step 3: Deduct Fare
    console.log(`[WORKFLOW] Step 3: Deducting fare from wallet...`);
    transaction = await deductFare(
      request.userId,
      RIDE_FARE,
      reservation.reservationId,
    );

    // Step 4: Confirm Booking
    console.log(`[WORKFLOW] Step 4: Confirming booking...`);
    const paymentDetails: PaymentDetails = {
      paymentId: transaction.transactionId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
    };

    const booking = await confirmBooking(reservation, paymentDetails);
    bookingId = booking.bookingId;
    bookedTime = Date.now(); // Capture time of confirmation
    bookingStatus = BookingStatus.IN_PROGRESS;
    await updateBookingStatus(bookingId, bookingStatus);
    console.log(`[WORKFLOW] Booking confirmed: ${booking.bookingId}`);

    // Step 5: Notify
    await CancellationScope.nonCancellable(async () => {
      const driverNotification: DriverNotification = {
        driverId: booking.driverId,
        bookingId: booking.bookingId,
        passengerName: `User-${request.userId}`,
        pickupLocation: request.startLocation,
        dropoffLocation: request.endLocation,
      };
      await notifyDriver(driverNotification);

      const passengerNotification: NotificationPayload = {
        userId: request.userId,
        type: "PUSH",
        subject: "Booking Confirmed",
        message: `Your VolteRyde bus is confirmed! Bus ${booking.vehicleId} will arrive at ${booking.estimatedArrivalTime.toISOString()}. Track your ride in the app.`,
        metadata: {
          bookingId: booking.bookingId,
          vehicleId: booking.vehicleId,
          busDetails: true, // Flag for client to fetch additional details via /driver endpoint
        },
      };
      await sendNotification(passengerNotification);
    });

    // ========================================================================
    // Wait for Ride Lifecycle (Completion or Cancellation)
    // ========================================================================
    console.log(`[WORKFLOW] Waiting for ride lifecycle events...`);

    // Wait until cancelled or completed (or timeout after 2 hours)
    await Promise.race([
      condition(() => rideCancelled),
      condition(() => rideCompleted),
      sleep("2 hours"), // Auto-complete or timeout
    ]);

    if (rideCancelled) {
      console.log(
        `[WORKFLOW] Processing cancellation with Time-Decay Penalty...`,
      );
      const now = Date.now();
      const effectiveBookedTime = bookedTime || now; // Fallback to now if null (shouldn't happen)
      const deltaMinutes = (now - effectiveBookedTime) / (1000 * 60);

      let penaltyPercentage = 0;
      // Updated Penalty Tiers (per business requirements)
      if (deltaMinutes <= 5) {
        penaltyPercentage = 0; // Grace period: 0-5 minutes = 0%
      } else if (deltaMinutes <= 10) {
        penaltyPercentage = 0.1; // 6-10 minutes = 10% penalty
      } else {
        penaltyPercentage = 0.3; // >10 minutes = 30% penalty
      }

      const penaltyAmount = RIDE_FARE * penaltyPercentage;
      const refundAmount = RIDE_FARE - penaltyAmount;

      console.log(
        `[WORKFLOW] Delta: ${deltaMinutes.toFixed(2)} mins. Penalty: ${penaltyPercentage * 100}%. Refund: ${refundAmount}`,
      );

      // Execute Refund
      await CancellationScope.nonCancellable(async () => {
        if (refundAmount > 0 && transaction) {
          await refundPartialWalletDeduction(transaction, refundAmount);
        }

        if (reservation) {
          await releaseSeatReservation(reservation);
        }

        bookingStatus = BookingStatus.CANCELLED;
        if (bookingId) await updateBookingStatus(bookingId, bookingStatus);

        await sendNotification({
          userId: request.userId,
          type: "PUSH",
          subject: "Ride Cancelled",
          message: `Ride cancelled. Refund: ${refundAmount} GHS. Penalty: ${penaltyAmount} GHS.`,
        });
      });

      return { ...booking, status: "CANCELLED" as any };
    } else {
      console.log(`[WORKFLOW] Ride completed normally.`);
      bookingStatus = BookingStatus.COMPLETED;
      if (bookingId) await updateBookingStatus(bookingId, bookingStatus);
      return booking;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[WORKFLOW] Booking workflow failed: ${errorMessage}`);
    bookingStatus = BookingStatus.FAILED;
    if (bookingId) await updateBookingStatus(bookingId, bookingStatus);

    if (transaction && transaction.status === "SUCCESS") {
      await CancellationScope.nonCancellable(async () => {
        if (transaction) await refundWalletDeduction(transaction);
        if (reservation) await releaseSeatReservation(reservation);
      });
    } else if (reservation) {
      await CancellationScope.nonCancellable(async () => {
        await releaseSeatReservation(reservation!);
      });
    }
    throw new Error(`Booking failed: ${errorMessage}`);
  }
}

export function getBookingStatus(): BookingStatus {
  return BookingStatus.PENDING;
}
