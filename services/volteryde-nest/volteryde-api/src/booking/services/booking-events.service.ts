// ============================================================================
// Booking Events Service
// ============================================================================
// Bridge between booking service and WebSocket gateway
// Handles event emission for booking state changes

import { Injectable, Logger } from '@nestjs/common';
import { TelematicsGateway } from '../../telematics/gateways/telematics.gateway';
import {
	BookingStateDto,
	BookingTripState,
	RouteUpdateDto,
	FareUpdateDto,
} from '../../telematics/dto/realtime-events.dto';

// ============================================================================
// Sequence number tracking for event ordering
// ============================================================================

interface BookingSequence {
	bookingId: string;
	sequence: number;
	lastState: BookingTripState;
	lastUpdate: number;
}

// ============================================================================
// Booking Events Service
// ============================================================================

@Injectable()
export class BookingEventsService {
	private readonly logger = new Logger(BookingEventsService.name);

	// Track sequence numbers for each booking to handle out-of-order events
	private sequenceMap: Map<string, BookingSequence> = new Map();

	constructor(private readonly telematicsGateway: TelematicsGateway) { }

	// ============================================================================
	// State Change Events
	// ============================================================================

	/**
	 * Emit booking state change event
	 * Called from booking service when state transitions occur
	 */
	emitBookingStateChange(
		bookingId: string,
		userId: string,
		state: BookingTripState,
		options?: {
			eta?: number;
			busId?: string;
			driverName?: string;
			busPlate?: string;
		},
	) {
		const sequence = this.getNextSequence(bookingId, state);

		const stateDto: BookingStateDto = {
			bookingId,
			state,
			eta: options?.eta,
			busId: options?.busId,
			driverName: options?.driverName,
			busPlate: options?.busPlate,
			sequenceNumber: sequence,
			timestamp: Date.now(),
		};

		try {
			this.telematicsGateway.broadcastBookingState(bookingId, userId, stateDto);
			this.logger.log(`Emitted state change for booking ${bookingId}: ${state}`);
		} catch (error) {
			this.logger.error(`Failed to emit state change for ${bookingId}:`, error);
		}
	}

	/**
	 * Emit route update event
	 * Called when route needs to be recalculated
	 */
	emitRouteUpdate(
		bookingId: string,
		polyline: string,
		distanceMeters?: number,
		durationMinutes?: number,
	) {
		const routeDto: RouteUpdateDto = {
			bookingId,
			polyline,
			distanceMeters,
			durationMinutes,
			timestamp: Date.now(),
		};

		try {
			this.telematicsGateway.broadcastRouteUpdate(bookingId, routeDto);
			this.logger.log(`Emitted route update for booking ${bookingId}`);
		} catch (error) {
			this.logger.error(`Failed to emit route update for ${bookingId}:`, error);
		}
	}

	/**
	 * Emit fare update event
	 * Called when fare changes (surge pricing, route change, etc.)
	 */
	emitFareUpdate(
		bookingId: string,
		fare: number,
		currency: string,
		reason?: string,
	) {
		const fareDto: FareUpdateDto = {
			bookingId,
			fare,
			currency,
			reason,
			timestamp: Date.now(),
		};

		try {
			this.telematicsGateway.broadcastFareUpdate(bookingId, fareDto);
			this.logger.log(`Emitted fare update for booking ${bookingId}: ${fare} ${currency}`);
		} catch (error) {
			this.logger.error(`Failed to emit fare update for ${bookingId}:`, error);
		}
	}

	// ============================================================================
	// Convenience Methods for Common State Transitions
	// ============================================================================

	/**
	 * Emit booking confirmed event
	 */
	emitBookingConfirmed(bookingId: string, userId: string) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.CONFIRMED);
	}

	/**
	 * Emit bus assigned event
	 */
	emitBusAssigned(
		bookingId: string,
		userId: string,
		busId: string,
		driverName?: string,
		busPlate?: string,
		eta?: number,
	) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.BUS_ASSIGNED, {
			busId,
			driverName,
			busPlate,
			eta,
		});
	}

	/**
	 * Emit bus en route event
	 */
	emitBusEnRoute(bookingId: string, userId: string, busId: string, eta: number) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.EN_ROUTE, {
			busId,
			eta,
		});
	}

	/**
	 * Emit bus arriving event (within 2 minutes)
	 */
	emitBusArriving(bookingId: string, userId: string, busId: string, eta: number) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.ARRIVING, {
			busId,
			eta,
		});
	}

	/**
	 * Emit bus arrived event
	 */
	emitBusArrived(bookingId: string, userId: string, busId: string) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.ARRIVED, {
			busId,
			eta: 0,
		});
	}

	/**
	 * Emit trip in progress event
	 */
	emitTripInProgress(bookingId: string, userId: string, busId: string, eta?: number) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.IN_PROGRESS, {
			busId,
			eta,
		});
	}

	/**
	 * Emit trip completed event
	 */
	emitTripCompleted(bookingId: string, userId: string) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.COMPLETED);
		this.cleanupSequence(bookingId);
	}

	/**
	 * Emit trip cancelled event
	 */
	emitTripCancelled(bookingId: string, userId: string) {
		this.emitBookingStateChange(bookingId, userId, BookingTripState.CANCELLED);
		this.cleanupSequence(bookingId);
	}

	// ============================================================================
	// Sequence Management (prevents out-of-order updates)
	// ============================================================================

	private getNextSequence(bookingId: string, state: BookingTripState): number {
		let seq = this.sequenceMap.get(bookingId);

		if (!seq) {
			seq = {
				bookingId,
				sequence: 0,
				lastState: state,
				lastUpdate: Date.now(),
			};
			this.sequenceMap.set(bookingId, seq);
		}

		seq.sequence += 1;
		seq.lastState = state;
		seq.lastUpdate = Date.now();

		return seq.sequence;
	}

	private cleanupSequence(bookingId: string) {
		// Delay cleanup to allow any pending events to complete
		setTimeout(() => {
			this.sequenceMap.delete(bookingId);
		}, 30000);
	}

	// ============================================================================
	// Cleanup
	// ============================================================================

	/**
	 * Cleanup old sequences (called periodically)
	 */
	cleanupStaleSequences() {
		const staleThreshold = Date.now() - (60 * 60 * 1000); // 1 hour

		for (const [bookingId, seq] of this.sequenceMap.entries()) {
			if (seq.lastUpdate < staleThreshold) {
				this.sequenceMap.delete(bookingId);
				this.logger.debug(`Cleaned up stale sequence for booking ${bookingId}`);
			}
		}
	}
}
