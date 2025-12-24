import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	MessageBody,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InfluxDbService } from '../influx/influxdb.service';

@WebSocketGateway({
	cors: {
		origin: '*', // Allow all origins for dev; restrict in prod
	},
	namespace: 'telematics',
})
export class TelematicsGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server!: Server;

	private readonly logger = new Logger(TelematicsGateway.name);

	constructor(private influxService: InfluxDbService) { }

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

	@SubscribeMessage('driver:location:update')
	async handleLocationUpdate(
		@MessageBody() data: { vehicleId: string; lat: number; lon: number; speed: number; battery: number },
		@ConnectedSocket() client: Socket,
	) {
		this.logger.debug(`Received location update for ${data.vehicleId}: ${data.lat}, ${data.lon}`);

		// 1. Write to Time-Series Database (InfluxDB)
		await this.influxService.writeVehicleLocation(
			data.vehicleId,
			data.lat,
			data.lon,
			data.speed,
			data.battery,
		);

		// 2. Broadcast to subscribers (e.g., dispatch dashboard, passenger app)
		// In a real scenario, we'd filter by room/topic (e.g., `ride:${rideId}`)
		this.server.emit(`vehicle:${data.vehicleId}:location`, data);
	}

	@SubscribeMessage('ride:subscribe')
	handleRideSubscribe(@MessageBody() rideId: string, @ConnectedSocket() client: Socket) {
		client.join(`ride:${rideId}`);
		this.logger.log(`Client ${client.id} subscribed to ride ${rideId}`);
		return { event: 'ride:subscribe', data: { success: true, rideId } };
	}
}
