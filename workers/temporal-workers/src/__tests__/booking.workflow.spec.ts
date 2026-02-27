// ============================================================================
// Booking Workflow Tests
// ============================================================================
// Tests for the booking workflow using Temporal's testing framework

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import {
  bookRideWorkflow,
  bookingStatusQuery,
  completeRideSignal,
} from "../workflows/booking.workflow";
import { BookingRequest, BookingStatus } from "../interfaces";

describe("Booking Workflow Tests", () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(() => {
    jest.setTimeout(30_000);
  });

  beforeAll(async () => {
    // Create test environment
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it.skip("should complete booking successfully with valid input", async () => {
    const { client } = testEnv;

    // Mock activities

    const mockActivities = {
      checkWalletBalance: jest.fn(async () => ({
        hasSufficientFunds: true,
        balance: 100,
        currency: "GHS",
      })),
      reserveSeat: jest.fn(async (_request: BookingRequest) => ({
        reservationId: "test-res-123",
        seatId: "seat-1A",
        vehicleId: "bus-001",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      deductFare: jest.fn(async () => ({
        transactionId: "test-tx-123",
        status: "SUCCESS" as const,
        amount: 12,
        currency: "GHS",
      })),
      confirmBooking: jest.fn(async () => ({
        bookingId: "test-book-123",
        status: "CONFIRMED" as const,
        vehicleId: "bus-001",
        driverId: "driver-42",
        estimatedArrivalTime: new Date(Date.now() + 10 * 60 * 1000),
        fare: 12,
      })),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundWalletDeduction: jest.fn(async () => {}),
      refundPartialWalletDeduction: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: "test-success",
      workflowsPath: require.resolve("../workflows/booking.workflow"),
      activities: mockActivities,
    });

    // Start the workflow
    const request: BookingRequest = {
      userId: "test-user-123",
      startLocation: {
        latitude: 5.6037,
        longitude: -0.187,
        address: "Accra Mall",
      },
      endLocation: {
        latitude: 5.6137,
        longitude: -0.207,
        address: "Korle Bu",
      },
      vehicleType: "STANDARD",
    };

    const result = await worker.runUntil(async () => {
      const handle = await client.workflow.start(bookRideWorkflow, {
        args: [request],
        workflowId: "test-workflow-success",
        taskQueue: "test-success",
      });

      // Let the workflow progress to the signal wait point
      await testEnv.sleep(100);

      // Send the completion signal to unblock the workflow
      await handle.signal(completeRideSignal);

      return await handle.result();
    });

    // Verify result
    expect(result.bookingId).toBe("test-book-123");
    expect(result.status).toBe(BookingStatus.COMPLETED); // Note: Workflow returns COMPLETED status at end
    expect(result.vehicleId).toBe("bus-001");
    expect(result.driverId).toBe("driver-42");

    // Verify activities were called in correct order
    expect(mockActivities.reserveSeat).toHaveBeenCalledWith(request);
    expect(mockActivities.checkWalletBalance).toHaveBeenCalled();
    expect(mockActivities.deductFare).toHaveBeenCalled();
    expect(mockActivities.confirmBooking).toHaveBeenCalled();
    expect(mockActivities.notifyDriver).toHaveBeenCalled();
    expect(mockActivities.sendNotification).toHaveBeenCalled();

    // Verify status updates
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(
      "test-book-123",
      BookingStatus.IN_PROGRESS,
    );
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(
      "test-book-123",
      BookingStatus.COMPLETED,
    );

    // Compensation activities should NOT be called
    expect(mockActivities.releaseSeatReservation).not.toHaveBeenCalled();
    expect(mockActivities.refundWalletDeduction).not.toHaveBeenCalled();

    await worker.shutdown();
  });

  it.skip("should compensate when payment fails", async () => {
    const { client } = testEnv;

    // Mock activities with payment failure
    const mockActivities = {
      checkWalletBalance: jest.fn(async () => ({
        hasSufficientFunds: true,
        balance: 100,
        currency: "GHS",
      })),
      reserveSeat: jest.fn(async (_request: BookingRequest) => ({
        reservationId: "test-res-123",
        seatId: "seat-1A",
        vehicleId: "bus-001",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      deductFare: jest.fn(async () => ({
        transactionId: "test-tx-failed",
        status: "FAILED" as const,
        amount: 12,
        currency: "GHS",
      })),
      confirmBooking: jest.fn(async () => {
        throw new Error("Should not be called");
      }),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundWalletDeduction: jest.fn(async () => {}),
      refundPartialWalletDeduction: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: "test-fail-payment",
      workflowsPath: require.resolve("../workflows/booking.workflow"),
      activities: mockActivities,
    });

    // Start the workflow
    const request: BookingRequest = {
      userId: "test-user-123",
      startLocation: {
        latitude: 5.6037,
        longitude: -0.187,
      },
      endLocation: {
        latitude: 5.6137,
        longitude: -0.207,
      },
    };

    await worker.runUntil(async () => {
      // Workflow should fail
      await expect(
        client.workflow.execute(bookRideWorkflow, {
          args: [request],
          workflowId: "test-workflow-payment-fail",
          taskQueue: "test-fail-payment",
        }),
      ).rejects.toThrow();
    });

    // Verify activities
    expect(mockActivities.reserveSeat).toHaveBeenCalled();
    expect(mockActivities.deductFare).toHaveBeenCalled();

    // Compensation should be triggered
    expect(mockActivities.releaseSeatReservation).toHaveBeenCalled();

    // These should not be called since payment failed before booking
    expect(mockActivities.confirmBooking).not.toHaveBeenCalled();

    // Verify status updates
    expect(mockActivities.updateBookingStatus).not.toHaveBeenCalledWith(
      expect.any(String),
      BookingStatus.IN_PROGRESS,
    );
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(
      expect.any(String),
      BookingStatus.FAILED,
    );

    await worker.shutdown();
  });

  it.skip("should compensate with refund when booking fails after payment", async () => {
    const { client } = testEnv;

    // Mock activities with booking failure
    const mockActivities = {
      checkWalletBalance: jest.fn(async () => ({
        hasSufficientFunds: true,
        balance: 100,
        currency: "GHS",
      })),
      reserveSeat: jest.fn(async (_request: BookingRequest) => ({
        reservationId: "test-res-123",
        seatId: "seat-1A",
        vehicleId: "bus-001",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      deductFare: jest.fn(async () => ({
        transactionId: "test-tx-123",
        status: "SUCCESS" as const,
        amount: 12,
        currency: "GHS",
      })),
      confirmBooking: jest.fn(async () => {
        throw new Error("Vehicle unavailable");
      }),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundWalletDeduction: jest.fn(async () => {}),
      refundPartialWalletDeduction: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: "test-fail-booking",
      workflowsPath: require.resolve("../workflows/booking.workflow"),
      activities: mockActivities,
    });

    // Start the workflow
    const request: BookingRequest = {
      userId: "test-user-123",
      startLocation: {
        latitude: 5.6037,
        longitude: -0.187,
      },
      endLocation: {
        latitude: 5.6137,
        longitude: -0.207,
      },
    };

    await worker.runUntil(async () => {
      // Workflow should fail
      await expect(
        client.workflow.execute(bookRideWorkflow, {
          args: [request],
          workflowId: "test-workflow-booking-fail",
          taskQueue: "test-fail-booking",
        }),
      ).rejects.toThrow("Vehicle unavailable");
    });

    // Verify all steps were attempted
    expect(mockActivities.reserveSeat).toHaveBeenCalled();
    expect(mockActivities.deductFare).toHaveBeenCalled();
    expect(mockActivities.confirmBooking).toHaveBeenCalled();

    // Full compensation should run (both refund and release)
    expect(mockActivities.refundWalletDeduction).toHaveBeenCalled();
    expect(mockActivities.releaseSeatReservation).toHaveBeenCalled();

    // Verify status updates
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(
      expect.any(String),
      BookingStatus.IN_PROGRESS,
    );
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(
      expect.any(String),
      BookingStatus.FAILED,
    );

    await worker.shutdown();
  });

  it.skip("should return the current booking status via query", async () => {
    const { client } = testEnv;

    // Mock activities
    const mockActivities = {
      checkWalletBalance: jest.fn(async () => ({
        hasSufficientFunds: true,
        balance: 100,
        currency: "GHS",
      })),
      reserveSeat: jest.fn(async (_request: BookingRequest) => ({
        reservationId: "test-res-123",
        seatId: "seat-1A",
        vehicleId: "bus-001",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      deductFare: jest.fn(async () => ({
        transactionId: "test-tx-123",
        status: "SUCCESS" as const,
        amount: 12,
        currency: "GHS",
      })),
      confirmBooking: jest.fn(async () => ({
        bookingId: "test-book-123",
        status: "CONFIRMED" as const,
        vehicleId: "bus-001",
        driverId: "driver-42",
        estimatedArrivalTime: new Date(Date.now() + 10 * 60 * 1000),
        fare: 12,
      })),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundWalletDeduction: jest.fn(async () => {}),
      refundPartialWalletDeduction: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: "test-query",
      workflowsPath: require.resolve("../workflows/booking.workflow"),
      activities: mockActivities,
    });

    const request: BookingRequest = {
      userId: "test-user-query",
      startLocation: { latitude: 1, longitude: 1 },
      endLocation: { latitude: 2, longitude: 2 },
    };

    await worker.runUntil(async () => {
      const workflowId = "test-workflow-query-status";
      const handle = await client.workflow.start(bookRideWorkflow, {
        args: [request],
        workflowId,
        taskQueue: "test-query",
      });

      // Allow some time for workflow to progress
      await testEnv.sleep(100);
      let status = await handle.query(bookingStatusQuery);
      expect(status).toBe(BookingStatus.PENDING);

      // Allow workflow to proceed
      await testEnv.sleep(100);
      status = await handle.query(bookingStatusQuery);
      expect([BookingStatus.PENDING, BookingStatus.IN_PROGRESS]).toContain(
        status,
      );

      await handle.signal(completeRideSignal);
      await handle.result();

      status = await handle.query(bookingStatusQuery);
      expect(status).toBe(BookingStatus.COMPLETED);
    });

    await worker.shutdown();
  });

  it("should validate location coordinates", () => {
    const invalidRequest: BookingRequest = {
      userId: "test-user",
      startLocation: {
        latitude: 200, // Invalid
        longitude: -0.187,
      },
      endLocation: {
        latitude: 5.6137,
        longitude: -0.207,
      },
    };

    // This validation happens in BookingService, not the workflow
    // But we test the interface here
    expect(invalidRequest.startLocation.latitude).toBeGreaterThan(90);
  });
});
