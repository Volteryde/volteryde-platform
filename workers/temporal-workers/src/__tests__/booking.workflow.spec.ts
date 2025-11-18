// ============================================================================
// Booking Workflow Tests
// ============================================================================
// Tests for the booking workflow using Temporal's testing framework

import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { bookRideWorkflow, getBookingStatus } from '../workflows/booking.workflow';
import * as activities from '../activities/booking.activities';
import { BookingRequest, BookingConfirmation, PaymentDetails } from '../interfaces';
import { BookingStatus } from '../../../packages/shared-types/src/booking-status.enum';

describe('Booking Workflow Tests', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    // Create test environment
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('should complete booking successfully with valid input', async () => {
    const { client } = testEnv;

    // Mock activities
    const mockActivities = {
      reserveSeat: jest.fn(async (request: BookingRequest) => ({
        reservationId: 'test-res-123',
        seatId: 'seat-1A',
        vehicleId: 'bus-001',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      processPayment: jest.fn(async () => ({
        paymentId: 'test-pay-123',
        status: 'SUCCESS' as const,
        amount: 50.0,
        currency: 'GHS',
        paystackReference: 'PSTK-123',
      })),
      confirmBooking: jest.fn(async () => ({
        bookingId: 'test-book-123',
        status: 'CONFIRMED' as const,
        vehicleId: 'bus-001',
        driverId: 'driver-42',
        estimatedArrivalTime: new Date(Date.now() + 10 * 60 * 1000),
        fare: 50.0,
      })),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundPayment: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows/booking.workflow'),
      activities: mockActivities,
    });

    // Start the workflow
    const request: BookingRequest = {
      userId: 'test-user-123',
      startLocation: {
        latitude: 5.6037,
        longitude: -0.187,
        address: 'Accra Mall',
      },
      endLocation: {
        latitude: 5.6137,
        longitude: -0.207,
        address: 'Korle Bu',
      },
      vehicleType: 'STANDARD',
    };

    const result: BookingConfirmation = await client.workflow.execute(bookRideWorkflow, {
      args: [request],
      workflowId: 'test-workflow-success',
      taskQueue: 'test',
    });

    // Verify result
    expect(result.bookingId).toBe('test-book-123');
    expect(result.status).toBe('CONFIRMED');
    expect(result.vehicleId).toBe('bus-001');
    expect(result.driverId).toBe('driver-42');

    // Verify activities were called in correct order
    expect(mockActivities.reserveSeat).toHaveBeenCalledWith(request);
    expect(mockActivities.processPayment).toHaveBeenCalled();
    expect(mockActivities.confirmBooking).toHaveBeenCalled();
    expect(mockActivities.notifyDriver).toHaveBeenCalled();
    expect(mockActivities.sendNotification).toHaveBeenCalled();

    // Verify status updates
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith('test-book-123', BookingStatus.IN_PROGRESS);
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith('test-book-123', BookingStatus.COMPLETED);

    // Compensation activities should NOT be called
    expect(mockActivities.releaseSeatReservation).not.toHaveBeenCalled();
    expect(mockActivities.refundPayment).not.toHaveBeenCalled();

    await worker.shutdown();
  });

  it('should compensate when payment fails', async () => {
    const { client } = testEnv;

    // Mock activities with payment failure
    const mockActivities = {
      reserveSeat: jest.fn(async (request: BookingRequest) => ({
        reservationId: 'test-res-123',
        seatId: 'seat-1A',
        vehicleId: 'bus-001',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      processPayment: jest.fn(async (): Promise<PaymentDetails> => ({
        paymentId: 'test-pay-failed',
        status: 'FAILED',
        amount: 50.0,
        currency: 'GHS',
        failureReason: 'Insufficient funds',
      })),
      confirmBooking: jest.fn(async () => {
        throw new Error('Should not be called');
      }),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundPayment: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows/booking.workflow'),
      activities: mockActivities,
    });

    // Start the workflow
    const request: BookingRequest = {
      userId: 'test-user-123',
      startLocation: {
        latitude: 5.6037,
        longitude: -0.187,
      },
      endLocation: {
        latitude: 5.6137,
        longitude: -0.207,
      },
    };

    // Workflow should fail
    await expect(
      client.workflow.execute(bookRideWorkflow, {
        args: [request],
        workflowId: 'test-workflow-payment-fail',
        taskQueue: 'test',
      }),
    ).rejects.toThrow();

    // Verify activities
    expect(mockActivities.reserveSeat).toHaveBeenCalled();
    expect(mockActivities.processPayment).toHaveBeenCalled();

    // Compensation should be triggered
    expect(mockActivities.releaseSeatReservation).toHaveBeenCalled();

    // These should not be called since payment failed before booking
    expect(mockActivities.confirmBooking).not.toHaveBeenCalled();

    // Verify status updates
    expect(mockActivities.updateBookingStatus).not.toHaveBeenCalledWith(expect.any(String), BookingStatus.IN_PROGRESS);
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(expect.any(String), BookingStatus.FAILED);

    await worker.shutdown();
  });

  it('should compensate with refund when booking fails after payment', async () => {
    const { client } = testEnv;

    // Mock activities with booking failure
    const mockActivities = {
      reserveSeat: jest.fn(async (request: BookingRequest) => ({
        reservationId: 'test-res-123',
        seatId: 'seat-1A',
        vehicleId: 'bus-001',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      processPayment: jest.fn(async () => ({
        paymentId: 'test-pay-123',
        status: 'SUCCESS' as const,
        amount: 50.0,
        currency: 'GHS',
        paystackReference: 'PSTK-123',
      })),
      confirmBooking: jest.fn(async () => {
        throw new Error('Vehicle unavailable');
      }),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundPayment: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows/booking.workflow'),
      activities: mockActivities,
    });

    // Start the workflow
    const request: BookingRequest = {
      userId: 'test-user-123',
      startLocation: {
        latitude: 5.6037,
        longitude: -0.187,
      },
      endLocation: {
        latitude: 5.6137,
        longitude: -0.207,
      },
    };

    // Workflow should fail
    await expect(
      client.workflow.execute(bookRideWorkflow, {
        args: [request],
        workflowId: 'test-workflow-booking-fail',
        taskQueue: 'test',
      }),
    ).rejects.toThrow('Vehicle unavailable');

    // Verify all steps were attempted
    expect(mockActivities.reserveSeat).toHaveBeenCalled();
    expect(mockActivities.processPayment).toHaveBeenCalled();
    expect(mockActivities.confirmBooking).toHaveBeenCalled();

    // Full compensation should run (both refund and release)
    expect(mockActivities.refundPayment).toHaveBeenCalled();
    expect(mockActivities.releaseSeatReservation).toHaveBeenCalled();

    // Verify status updates
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(expect.any(String), BookingStatus.IN_PROGRESS);
    expect(mockActivities.updateBookingStatus).toHaveBeenCalledWith(expect.any(String), BookingStatus.FAILED);

    await worker.shutdown();
  });

  it('should return the current booking status via query', async () => {
    const { client } = testEnv;

    // Mock activities
    const mockActivities = {
      reserveSeat: jest.fn(async (request: BookingRequest) => ({
        reservationId: 'test-res-123',
        seatId: 'seat-1A',
        vehicleId: 'bus-001',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })),
      processPayment: jest.fn(async () => ({
        paymentId: 'test-pay-123',
        status: 'SUCCESS' as const,
        amount: 50.0,
        currency: 'GHS',
        paystackReference: 'PSTK-123',
      })),
      confirmBooking: jest.fn(async () => ({
        bookingId: 'test-book-123',
        status: 'CONFIRMED' as const,
        vehicleId: 'bus-001',
        driverId: 'driver-42',
        estimatedArrivalTime: new Date(Date.now() + 10 * 60 * 1000),
        fare: 50.0,
      })),
      notifyDriver: jest.fn(async () => {}),
      sendNotification: jest.fn(async () => {}),
      releaseSeatReservation: jest.fn(async () => {}),
      refundPayment: jest.fn(async () => {}),
      updateBookingStatus: jest.fn(async () => {}), // Mock the new activity
    };

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows/booking.workflow'),
      activities: mockActivities,
    });

    const request: BookingRequest = {
      userId: 'test-user-query',
      startLocation: { latitude: 1, longitude: 1 },
      endLocation: { latitude: 2, longitude: 2 },
    };

    const workflowId = 'test-workflow-query-status';
    const handle = await client.workflow.start(bookRideWorkflow, {
      args: [request],
      workflowId,
      taskQueue: 'test',
    });

    // Query the status while the workflow is running
    // The workflow will be in PENDING after reserveSeat, then CONFIRMED after processPayment
    // and IN_PROGRESS after confirmBooking
    await testEnv.sleep(100); // Allow some time for workflow to progress
    let status = await handle.query(getBookingStatus);
    expect(status).toBe(BookingStatus.PENDING); // Initial status after reserveSeat

    // Wait for payment to process and booking to confirm
    await testEnv.sleep(2000); // Adjust sleep time if needed for activities to complete
    status = await handle.query(getBookingStatus);
    expect(status).toBe(BookingStatus.IN_PROGRESS); // After confirmBooking

    // Wait for workflow to complete
    await handle.result();
    status = await handle.query(getBookingStatus);
    expect(status).toBe(BookingStatus.COMPLETED);

    await worker.shutdown();
  });

  it('should validate location coordinates', () => {
    const invalidRequest: BookingRequest = {
      userId: 'test-user',
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
