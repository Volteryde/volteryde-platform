// ============================================================================
// Telematics WebSocket Gateway
// ============================================================================
// Real-time WebSocket gateway for bus tracking and booking state updates
// Uses Socket.IO with room-based subscriptions for efficient broadcasting

import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	ConnectedSocket,
	MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import {
	BusLocationDto,
	BusStatusDto,
	BookingStateDto,
	RouteUpdateDto,
	FareUpdateDto,
	SubscribeBookingDto,
	SubscribeBusDto,
	SubscribeRouteDto,
	ConnectionAckDto,
	ErrorDto,
} from '../dto/realtime-events.dto';

// ============================================================================
// Event Names Constants
// ============================================================================

export const WS_EVENTS = {
	// Server -> Client events
	BUS_LOCATION: 'bus:location',
	BUS_STATUS: 'bus:status',
	BOOKING_STATE: 'booking:state',
	ROUTE_UPDATE: 'route:update',
	FARE_UPDATE: 'fare:update',
	CONNECTION_ACK: 'connection:ack',
	ERROR: 'error',

	// Client -> Server events
	SUBSCRIBE_BOOKING: 'subscribe:booking',
	SUBSCRIBE_BUS: 'subscribe:bus',
	SUBSCRIBE_ROUTE: 'subscribe:route',
	UNSUBSCRIBE: 'unsubscribe',
	PING: 'ping',
} as const;

// ============================================================================
// Room Prefix Constants
// ============================================================================

export const ROOM_PREFIXES = {
	BOOKING: 'booking:',
	BUS: 'bus:',
	ROUTE: 'route:',
	USER: 'user:',
} as const;

// ============================================================================
// WebSocket Gateway
// ============================================================================

@Injectable()
@WebSocketGateway({
	namespace: '/ws/telematics',
	cors: {
		origin: '*', // Configure appropriately for production
		credentials: true,
	},
	transports: ['websocket', 'polling'],
})
export class TelematicsGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(TelematicsGateway.name);

	// Track connected clients for monitoring
	private connectedClients: Map<string, { userId?: string; connectedAt: number }> = new Map();

	// ============================================================================
	// Lifecycle Hooks
	// ============================================================================

	afterInit(server: Server) {
		this.logger.log('Telematics WebSocket Gateway initialized');

		// Optional: Configure Redis adapter for horizontal scaling
		// const redisAdapter = createAdapter(pubClient, subClient);
		// server.adapter(redisAdapter);
	}

	async handleConnection(client: Socket) {
		try {
			// Extract token from handshake for authentication
			const token = client.handshake.auth?.token || client.handshake.headers?.authorization;

			let userId: string | undefined;

			if (token) {
				// TODO: Validate JWT token and extract userId
				// For now, we'll accept connections without strict auth for development
				// userId = await this.validateToken(token);
				userId = client.handshake.auth?.userId;
			}

			this.connectedClients.set(client.id, {
				userId,
				connectedAt: Date.now(),
			});

			// Join user-specific room if authenticated
			if (userId) {
				await client.join(`${ROOM_PREFIXES.USER}${userId}`);
			}

			// Send connection acknowledgment
			const ack: ConnectionAckDto = {
				success: true,
				userId,
				message: 'Connected to Telematics Gateway',
				timestamp: Date.now(),
			};
			client.emit(WS_EVENTS.CONNECTION_ACK, ack);

			this.logger.log(`Client connected: ${client.id} (userId: ${userId || 'anonymous'})`);
		} catch (error) {
			this.logger.error(`Connection error for client ${client.id}:`, error);
			const errorDto: ErrorDto = {
				code: 'CONNECTION_ERROR',
				message: 'Failed to establish connection',
				timestamp: Date.now(),
			};
			client.emit(WS_EVENTS.ERROR, errorDto);
			client.disconnect();
		}
	}

	handleDisconnect(client: Socket) {
		const clientInfo = this.connectedClients.get(client.id);
		this.connectedClients.delete(client.id);
		this.logger.log(`Client disconnected: ${client.id} (userId: ${clientInfo?.userId || 'anonymous'})`);
	}

	// ============================================================================
	// Client Subscription Handlers
	// ============================================================================

	@SubscribeMessage(WS_EVENTS.SUBSCRIBE_BOOKING)
	async handleSubscribeBooking(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: SubscribeBookingDto,
	) {
		try {
			const room = `${ROOM_PREFIXES.BOOKING}${data.bookingId}`;
			await client.join(room);
			this.logger.debug(`Client ${client.id} subscribed to ${room}`);
			return { success: true, room };
		} catch (error) {
			this.logger.error(`Failed to subscribe to booking ${data.bookingId}:`, error);
			return { success: false, error: 'Subscription failed' };
		}
	}

	@SubscribeMessage(WS_EVENTS.SUBSCRIBE_BUS)
	async handleSubscribeBus(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: SubscribeBusDto,
	) {
		try {
			const room = `${ROOM_PREFIXES.BUS}${data.busId}`;
			await client.join(room);
			this.logger.debug(`Client ${client.id} subscribed to ${room}`);
			return { success: true, room };
		} catch (error) {
			this.logger.error(`Failed to subscribe to bus ${data.busId}:`, error);
			return { success: false, error: 'Subscription failed' };
		}
	}

	@SubscribeMessage(WS_EVENTS.SUBSCRIBE_ROUTE)
	async handleSubscribeRoute(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: SubscribeRouteDto,
	) {
		try {
			const room = `${ROOM_PREFIXES.ROUTE}${data.routeId}`;
			await client.join(room);
			this.logger.debug(`Client ${client.id} subscribed to ${room}`);
			return { success: true, room };
		} catch (error) {
			this.logger.error(`Failed to subscribe to route ${data.routeId}:`, error);
			return { success: false, error: 'Subscription failed' };
		}
	}

	@SubscribeMessage(WS_EVENTS.UNSUBSCRIBE)
	async handleUnsubscribe(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { room: string },
	) {
		try {
			await client.leave(data.room);
			this.logger.debug(`Client ${client.id} unsubscribed from ${data.room}`);
			return { success: true };
		} catch (error) {
			this.logger.error(`Failed to unsubscribe from ${data.room}:`, error);
			return { success: false, error: 'Unsubscription failed' };
		}
	}

	@SubscribeMessage(WS_EVENTS.PING)
	handlePing(@ConnectedSocket() client: Socket) {
		return { pong: Date.now() };
	}

	// ============================================================================
	// Broadcasting Methods (called by services)
	// ============================================================================

	/**
	 * Broadcast bus location update to all subscribers
	 */
	broadcastBusLocation(busId: string, location: BusLocationDto) {
		const room = `${ROOM_PREFIXES.BUS}${busId}`;
		this.server.to(room).emit(WS_EVENTS.BUS_LOCATION, location);
		this.logger.debug(`Broadcast bus location for ${busId}`);
	}

	/**
	 * Broadcast bus status update to all subscribers
	 */
	broadcastBusStatus(busId: string, status: BusStatusDto) {
		const room = `${ROOM_PREFIXES.BUS}${busId}`;
		this.server.to(room).emit(WS_EVENTS.BUS_STATUS, status);
		this.logger.debug(`Broadcast bus status for ${busId}: ${status.status}`);
	}

	/**
	 * Broadcast booking state change to booking room and user room
	 */
	broadcastBookingState(bookingId: string, userId: string, state: BookingStateDto) {
		const bookingRoom = `${ROOM_PREFIXES.BOOKING}${bookingId}`;
		const userRoom = `${ROOM_PREFIXES.USER}${userId}`;

		// Broadcast to both rooms
		this.server.to(bookingRoom).to(userRoom).emit(WS_EVENTS.BOOKING_STATE, state);
		this.logger.debug(`Broadcast booking state for ${bookingId}: ${state.state}`);
	}

	/**
	 * Broadcast route update to booking subscribers
	 */
	broadcastRouteUpdate(bookingId: string, route: RouteUpdateDto) {
		const room = `${ROOM_PREFIXES.BOOKING}${bookingId}`;
		this.server.to(room).emit(WS_EVENTS.ROUTE_UPDATE, route);
		this.logger.debug(`Broadcast route update for ${bookingId}`);
	}

	/**
	 * Broadcast fare update to booking subscribers
	 */
	broadcastFareUpdate(bookingId: string, fare: FareUpdateDto) {
		const room = `${ROOM_PREFIXES.BOOKING}${bookingId}`;
		this.server.to(room).emit(WS_EVENTS.FARE_UPDATE, fare);
		this.logger.debug(`Broadcast fare update for ${bookingId}: ${fare.fare} ${fare.currency}`);
	}

	/**
	 * Send message to specific user
	 */
	sendToUser(userId: string, event: string, data: any) {
		const room = `${ROOM_PREFIXES.USER}${userId}`;
		this.server.to(room).emit(event, data);
	}

	// ============================================================================
	// Monitoring Methods
	// ============================================================================

	/**
	 * Get count of connected clients
	 */
	getConnectedClientCount(): number {
		return this.connectedClients.size;
	}

	/**
	 * Get room subscriber count
	 */
	async getRoomSubscriberCount(room: string): Promise<number> {
		const sockets = await this.server.in(room).fetchSockets();
		return sockets.length;
	}
}
