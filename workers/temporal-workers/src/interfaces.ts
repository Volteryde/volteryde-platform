// ============================================================================
// Shared Interfaces for Temporal Workflows
// ============================================================================
// These interfaces define the data contracts between workflows and activities

/**
 * Booking Status Enum
 * Copied from shared-types to avoid rootDir issues in Temporal worker
 */
export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * GPS Location coordinates
 */
export interface GpsLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Request to start a booking workflow
 */
export interface BookingRequest {
  userId: string;
  startLocation: GpsLocation;
  endLocation: GpsLocation;
  vehicleType?: "STANDARD" | "PREMIUM" | "SHUTTLE";
  scheduledTime?: Date;
  passengerCount?: number;
  tripId?: string;
  fromStopId?: string;
  toStopId?: string;
}

/**
 * Seat reservation details
 */
export interface Reservation {
  reservationId: string;
  seatId: string;
  vehicleId: string;
  expiresAt: Date;
}

/**
 * Payment processing result
 */
export interface PaymentDetails {
  paymentId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  amount: number;
  currency: string;
  paystackReference?: string;
  failureReason?: string;
}

/**
 * Final booking confirmation
 */
export interface BookingConfirmation {
  bookingId: string;
  status: "CONFIRMED" | "PENDING" | "FAILED";
  vehicleId: string;
  driverId: string;
  estimatedArrivalTime: Date;
  fare: number;
}

/**
 * Notification details
 */
export interface NotificationPayload {
  userId: string;
  type: "SMS" | "EMAIL" | "PUSH";
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Fleet operation request
 */
export interface FleetOperationRequest {
  vehicleId: string;
  operationType: "ASSIGN_DRIVER" | "START_ROUTE" | "COMPLETE_ROUTE";
  driverId?: string;
  routeId?: string;
}

/**
 * Driver notification details
 */
export interface DriverNotification {
  driverId: string;
  bookingId: string;
  passengerName: string;
  pickupLocation: GpsLocation;
  dropoffLocation: GpsLocation;
}

/**
 * Wallet balance details
 */
export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  hasSufficientFunds: boolean;
}

/**
 * Wallet transaction details
 */
export interface WalletTransaction {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  type: "DEBIT" | "CREDIT";
  status: "SUCCESS" | "FAILED";
  timestamp: Date;
  failureReason?: string;
}

/**
 * Charging Session Start Request
 */
export interface StartChargingSessionRequest {
  stationId: string;
  connectorId: string;
  vehicleId: string;
  userId: string;
}

/**
 * Charging Session details
 */
export interface ChargingSession {
  id: string;
  stationId: string;
  connectorId: string;
  userId: string;
  vehicleId: string;
  startTime: Date;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  energyConsumedKwh?: number;
  cost?: number;
}
