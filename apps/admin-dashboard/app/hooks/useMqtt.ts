import { useEffect, useState, useRef } from 'react';
import mqtt, { type MqttClient, type IClientOptions } from 'mqtt';

interface MqttMessage {
  topic: string;
  payload: string;
  parsedPayload?: any;
}

interface MqttHookResult {
  isConnected: boolean;
  messages: MqttMessage[];
  publish: (topic: string, payload: string | object, options?: mqtt.IClientPublishOptions) => void;
  subscribe: (topic: string | string[], options?: mqtt.IClientSubscribeOptions) => void;
  unsubscribe: (topic: string | string[]) => void;
}

export const useMqtt = (brokerUrl: string, options?: IClientOptions): MqttHookResult => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    if (!brokerUrl) {
      console.warn('MQTT Broker URL is not provided.');
      return;
    }

    const client = mqtt.connect(brokerUrl, options);
    clientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to MQTT broker:', brokerUrl);
    });

    client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });

    client.on('close', () => {
      setIsConnected(false);
      console.log('Disconnected from MQTT broker');
    });

    client.on('error', (err) => {
      console.error('MQTT connection error:', err);
      client.end();
    });

    client.on('message', (topic, payload) => {
      const message: MqttMessage = {
        topic,
        payload: payload.toString(),
      };
      try {
        message.parsedPayload = JSON.parse(payload.toString());
      } catch (e) {
        // Not a JSON payload, keep as string
      }
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.end(true, () => {
          console.log('MQTT client disconnected on cleanup');
        });
      }
    };
  }, [brokerUrl, JSON.stringify(options)]); // Reconnect if URL or options change

  const publish = (topic: string, payload: string | object, publishOptions?: mqtt.IClientPublishOptions) => {
    if (clientRef.current && isConnected) {
      const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
      clientRef.current.publish(topic, message, publishOptions || {}, (err) => {
        if (err) {
          console.error(`Failed to publish to ${topic}:`, err);
        } else {
          console.log(`Published to ${topic}: ${message}`);
        }
      });
    } else {
      console.warn('Cannot publish, MQTT client not connected.');
    }
  };

  const subscribe = (topic: string | string[], subscribeOptions?: mqtt.IClientSubscribeOptions) => {
    if (clientRef.current && isConnected) {
      clientRef.current.subscribe(topic, subscribeOptions || { qos: 0 }, (err, granted) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          console.log('Subscribed to:', granted);
        }
      });
    } else {
      console.warn('Cannot subscribe, MQTT client not connected.');
    }
  };

  const unsubscribe = (topic: string | string[]) => {
    if (clientRef.current && isConnected) {
      clientRef.current.unsubscribe(topic, (err: Error | null) => {
        if (err) {
          console.error(`Failed to unsubscribe from ${topic}:`, err);
        } else {
          console.log('Unsubscribed from:', topic);
        }
      });
    } else {
      console.warn('Cannot unsubscribe, MQTT client not connected.');
    }
  };

  return { isConnected, messages, publish, subscribe, unsubscribe };
};
