import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { MqttClient, IClientOptions } from 'mqtt';
import { ConfigService } from '@nestjs/config';

const BACKOFF_INITIAL_MS = 2_000;
const BACKOFF_MAX_MS = 60_000;
const LOG_REPEAT_EVERY = 10; // only re-log connection failures every N attempts

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: MqttClient | null = null;
  private readonly logger = new Logger(MqttService.name);
  private reconnectAttempts = 0;
  private backoffMs = BACKOFF_INITIAL_MS;
  private connected = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const brokerUrl = this.configService.get<string>('MQTT_BROKER_URL');
    if (!brokerUrl) {
      this.logger.warn('MQTT_BROKER_URL not configured — MQTT disabled');
      return;
    }
    this.connect(brokerUrl);
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect(brokerUrl: string) {
    const options: IClientOptions = {
      clientId: `nestjs_backend_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 0, // disable auto-reconnect — we manage backoff manually
    };

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', () => {
      this.reconnectAttempts = 0;
      this.backoffMs = BACKOFF_INITIAL_MS;
      this.connected = true;
      this.logger.log(`Connected to MQTT broker: ${brokerUrl}`);
    });

    this.client.on('error', (error) => {
      // Only log the first attempt and every LOG_REPEAT_EVERY thereafter
      if (this.reconnectAttempts === 0 || this.reconnectAttempts % LOG_REPEAT_EVERY === 0) {
        this.logger.warn(
          `MQTT unavailable (attempt ${this.reconnectAttempts + 1}): ${error.message} — retrying in ${this.backoffMs / 1000}s`,
        );
      }
    });

    this.client.on('close', () => {
      if (this.connected) {
        this.logger.warn('MQTT connection lost — will reconnect with backoff');
        this.connected = false;
      }
      this.scheduleReconnect(brokerUrl);
    });
  }

  private scheduleReconnect(brokerUrl: string) {
    this.reconnectAttempts++;
    const delay = Math.min(this.backoffMs, BACKOFF_MAX_MS);
    this.backoffMs = Math.min(this.backoffMs * 2, BACKOFF_MAX_MS);

    setTimeout(() => {
      if (this.client) {
        this.client.removeAllListeners();
        this.client.end(true);
      }
      this.connect(brokerUrl);
    }, delay);
  }

  private disconnect() {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.end(true);
      this.client = null;
    }
  }

  get isConnected(): boolean {
    return this.connected;
  }

  publish(topic: string, payload: any, options?: mqtt.IClientPublishOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connected) {
        // silent drop — caller handles optional MQTT gracefully
        return resolve();
      }
      const message = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
      this.client.publish(topic, message, options, (err) => {
        if (err) {
          this.logger.error(`Failed to publish to ${topic}: ${err.message}`);
          return reject(err);
        }
        this.logger.debug(`Published to ${topic}`);
        resolve();
      });
    });
  }

  subscribe(topic: string | string[], options?: mqtt.IClientSubscribeOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connected) {
        this.logger.warn(`Cannot subscribe to ${String(topic)} — MQTT not connected`);
        return reject(new Error('MQTT client not connected'));
      }
      this.client.subscribe(topic, options, (err, granted) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${String(topic)}: ${err.message}`);
          return reject(err);
        }
        this.logger.log(`Subscribed to: ${granted.map(g => g.topic).join(', ')}`);
        resolve();
      });
    });
  }

  getClient(): MqttClient | null {
    return this.client;
  }
}
