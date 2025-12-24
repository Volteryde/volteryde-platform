import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxDbService implements OnModuleInit {
	private readonly logger = new Logger(InfluxDbService.name);
	private writeApi: WriteApi;
	private client: InfluxDB;

	constructor(private configService: ConfigService) { }

	onModuleInit() {
		const url = this.configService.get<string>('INFLUXDB_URL');
		const token = this.configService.get<string>('INFLUXDB_TOKEN');
		const org = this.configService.get<string>('INFLUXDB_ORG');
		const bucket = this.configService.get<string>('INFLUXDB_BUCKET');

		if (!url || !token || !org || !bucket) {
			this.logger.error('InfluxDB configuration missing');
			return;
		}

		this.client = new InfluxDB({ url, token });
		this.writeApi = this.client.getWriteApi(org, bucket);
		this.logger.log(`InfluxDB initialized for org: ${org}, bucket: ${bucket}`);
	}

	async writePoint(point: Point) {
		if (!this.writeApi) return;
		try {
			this.writeApi.writePoint(point);
			// Flush immediately for real-time tracking, or buffer for batching
			// this.writeApi.flush(); 
		} catch (e) {
			this.logger.error('Error writing to InfluxDB', e);
		}
	}

	async writeVehicleLocation(vehicleId: string, lat: number, lon: number, speed: number, battery: number) {
		const point = new Point('vehicle_telemetry')
			.tag('vehicle_id', vehicleId)
			.floatField('latitude', lat)
			.floatField('longitude', lon)
			.floatField('speed', speed)
			.floatField('battery_level', battery);

		await this.writePoint(point);
	}
}
