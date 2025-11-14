// ============================================================================
// Telematics WebSocket Gateway
// ============================================================================
// Real-time updates for vehicle location and diagnostics

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately in production
    credentials: true,
  },
  namespace: '/telematics/live',
})
export class TelematicsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelematicsGateway.name);

  // Track active subscriptions
  private vehicleSubscriptions = new Map<string, Set<string>>();

  afterInit() {
    this.logger.log('Telematics WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clean up subscriptions for this client
    this.vehicleSubscriptions.forEach((clients, vehicleId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.vehicleSubscriptions.delete(vehicleId);
      }
    });
  }

  /**
   * Subscribe to vehicle updates
   */
  @SubscribeMessage('subscribe:vehicle')
  handleSubscribeVehicle(
    @MessageBody() data: { vehicleId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { vehicleId } = data;
    const room = `vehicle:${vehicleId}`;

    // Join room
    client.join(room);

    // Track subscription
    if (!this.vehicleSubscriptions.has(vehicleId)) {
      this.vehicleSubscriptions.set(vehicleId, new Set());
    }
    this.vehicleSubscriptions.get(vehicleId)!.add(client.id);

    this.logger.log(
      `Client ${client.id} subscribed to vehicle ${vehicleId} (${this.vehicleSubscriptions.get(vehicleId)!.size} subscribers)`,
    );

    return {
      success: true,
      vehicleId,
      room,
      message: `Subscribed to vehicle ${vehicleId} updates`,
    };
  }

  /**
   * Unsubscribe from vehicle updates
   */
  @SubscribeMessage('unsubscribe:vehicle')
  handleUnsubscribeVehicle(
    @MessageBody() data: { vehicleId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { vehicleId } = data;
    const room = `vehicle:${vehicleId}`;

    // Leave room
    client.leave(room);

    // Remove from tracking
    if (this.vehicleSubscriptions.has(vehicleId)) {
      this.vehicleSubscriptions.get(vehicleId)!.delete(client.id);
      if (this.vehicleSubscriptions.get(vehicleId)!.size === 0) {
        this.vehicleSubscriptions.delete(vehicleId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from vehicle ${vehicleId}`);

    return {
      success: true,
      vehicleId,
      message: `Unsubscribed from vehicle ${vehicleId} updates`,
    };
  }

  /**
   * Subscribe to all vehicles (for admin dashboard)
   */
  @SubscribeMessage('subscribe:all')
  handleSubscribeAll(@ConnectedSocket() client: Socket) {
    client.join('all-vehicles');
    this.logger.log(`Client ${client.id} subscribed to all vehicles`);

    return {
      success: true,
      message: 'Subscribed to all vehicle updates',
    };
  }

  /**
   * Ping/Pong for connection health check
   */
  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', timestamp: new Date() };
  }

  // =========================================================================
  // Broadcast Methods (called by TelematicsService)
  // =========================================================================

  /**
   * Broadcast location update to subscribed clients
   */
  broadcastLocationUpdate(vehicleId: string, location: any) {
    const room = `vehicle:${vehicleId}`;
    const payload = {
      vehicleId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed || 0,
        heading: location.heading || 0,
        accuracy: location.accuracy,
      },
      timestamp: new Date(),
    };

    // Broadcast to vehicle-specific room
    this.server.to(room).emit('location:update', payload);

    // Also broadcast to 'all-vehicles' room (for admin dashboard)
    this.server.to('all-vehicles').emit('location:update', payload);

    this.logger.debug(`Location update broadcast for vehicle ${vehicleId}`);
  }

  /**
   * Broadcast diagnostics update
   */
  broadcastDiagnosticsUpdate(vehicleId: string, diagnostics: any) {
    const room = `vehicle:${vehicleId}`;
    const payload = {
      vehicleId,
      diagnostics,
      timestamp: new Date(),
    };

    this.server.to(room).emit('diagnostics:update', payload);
    this.server.to('all-vehicles').emit('diagnostics:update', payload);

    this.logger.debug(`Diagnostics update broadcast for vehicle ${vehicleId}`);
  }

  /**
   * Broadcast alert
   */
  broadcastAlert(vehicleId: string, alert: string, severity: 'LOW' | 'MEDIUM' | 'HIGH') {
    const room = `vehicle:${vehicleId}`;
    const payload = {
      vehicleId,
      alert,
      severity,
      timestamp: new Date(),
    };

    this.server.to(room).emit('alert', payload);
    this.server.to('all-vehicles').emit('alert', payload);

    this.logger.warn(`Alert broadcast for vehicle ${vehicleId}: ${alert}`);
  }

  /**
   * Get active subscriptions (for monitoring)
   */
  getActiveSubscriptions(): Map<string, number> {
    const stats = new Map<string, number>();
    this.vehicleSubscriptions.forEach((clients, vehicleId) => {
      stats.set(vehicleId, clients.size);
    });
    return stats;
  }
}
