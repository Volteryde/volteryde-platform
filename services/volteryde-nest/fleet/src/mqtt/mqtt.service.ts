import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { MqttClient, IClientOptions } from 'mqtt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: MqttClient;
  private readonly logger = new Logger(MqttService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    const mqttUrl = this.configService.get<string>('MQTT_BROKER_URL') || 'mqtt://localhost:1883';
    const options: IClientOptions = {
      clientId: `nestjs_backend_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    this.client = mqtt.connect(mqttUrl, options);

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker: ${mqttUrl}`);
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT connection error: ${error.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn('MQTT connection closed');
    });

    this.client.on('reconnect', () => {
      this.logger.warn('MQTT reconnecting...');
    });

    this.client.on('message', (topic, payload) => {
      this.logger.debug(`Received MQTT message on topic ${topic}: ${payload.toString()}`);
      // Handle incoming messages if needed by other services
      // For now, this service primarily publishes
    });
  }

  private disconnect() {
    if (this.client && this.client.connected) {
      this.client.end(false, () => {
        this.logger.log('Disconnected from MQTT broker');
      });
    }
  }

  publish(topic: string, payload: any, options?: mqtt.IClientPublishOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        this.logger.warn(`Attempted to publish to ${topic} while MQTT client is not connected.`);
        return reject(new Error('MQTT client not connected.'));
      }
      const message = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
      this.client.publish(topic, message, options, (err) => {
        if (err) {
          this.logger.error(`Failed to publish to topic ${topic}: ${err.message}`);
          return reject(err);
        }
        this.logger.debug(`Published to topic ${topic}: ${message}`);
        resolve();
      });
    });
  }

  subscribe(topic: string | string[], options?: mqtt.IClientSubscribeOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        this.logger.warn(`Attempted to subscribe to ${topic} while MQTT client is not connected.`);
        return reject(new Error('MQTT client not connected.'));
      }
      this.client.subscribe(topic, options, (err, granted) => {
        if (err) {
          this.logger.error(`Failed to subscribe to topic ${topic}: ${err.message}`);
          return reject(err);
        }
        this.logger.log(`Subscribed to topic(s): ${granted.map(g => g.topic).join(', ')}`);
        resolve();
      });
    });
  }

  // Expose the client for advanced usage if necessary
  getClient(): MqttClient {
    return this.client;
  }
}
