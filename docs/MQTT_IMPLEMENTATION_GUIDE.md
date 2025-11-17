# MQTT Implementation Guide

This document outlines the transition from WebSocket-based real-time communication to MQTT for the Volteryde platform, detailing the implementation, topic structure, and operational procedures.

## 1. Overview

The Volteryde platform is transitioning from using WebSockets (specifically `socket.io` with NestJS) for real-time updates to MQTT. This change aims to leverage MQTT's advantages in IoT scenarios, including its lightweight nature, publish-subscribe model, and robust support for various client types and network conditions.

## 2. MQTT Broker Selection

*   **Production Environment:** **AWS IoT Core** has been selected as the primary MQTT broker for production deployments. This choice is driven by its seamless integration with other AWS services, scalability, security features, and reduced operational overhead as a managed service.
*   **Local Development Environment:** **Mosquitto** is used for local development. It is deployed via `docker-compose` and configured to support both standard MQTT (port 1883) and MQTT over WebSockets (port 9001), facilitating frontend development.

## 3. MQTT Topic Hierarchy

The MQTT topic hierarchy is designed to be logical, granular, and extensible, mirroring the previous WebSocket communication patterns. The base topic for telematics data is `volteryde/telematics/live`.

### Vehicle-Specific Updates

These topics are used for individual vehicles to publish data and for clients interested in a specific vehicle's updates to subscribe.

*   **Location Updates:** `volteryde/telematics/live/vehicle/<vehicleId>/location`
    *   **Purpose:** Real-time geographical position, speed, heading, and accuracy.
    *   **Payload Example:**
        ```json
        {
          "vehicleId": "VEH-001",
          "location": {
            "latitude": 34.052235,
            "longitude": -118.243683,
            "speed": 60,
            "heading": 90,
            "accuracy": 5
          },
          "timestamp": "2023-10-27T10:00:00.000Z"
        }
        ```
*   **Diagnostics Updates:** `volteryde/telematics/live/vehicle/<vehicleId>/diagnostics`
    *   **Purpose:** Real-time vehicle health and diagnostic information (e.g., battery level, temperatures).
    *   **Payload Example:**
        ```json
        {
          "vehicleId": "VEH-001",
          "diagnostics": {
            "batteryLevel": 85,
            "motorTemperature": 75,
            "tirePressure": "NORMAL"
          },
          "timestamp": "2023-10-27T10:00:00.000Z"
        }
        ```
*   **Alerts:** `volteryde/telematics/live/vehicle/<vehicleId>/alert`
    *   **Purpose:** Critical alerts or notifications related to a specific vehicle.
    *   **Payload Example:**
        ```json
        {
          "vehicleId": "VEH-001",
          "alert": "LOW_BATTERY",
          "severity": "HIGH",
          "timestamp": "2023-10-27T10:00:00.000Z"
        }
        ```

### All Vehicles Updates (for Admin Dashboard)

These topics are used by the backend to re-publish aggregated data, allowing administrative dashboards to subscribe to a single topic for a consolidated view of all vehicles.

*   **All Location Updates:** `volteryde/telematics/live/all/location`
*   **All Diagnostics Updates:** `volteryde/telematics/live/all/diagnostics`
*   **All Alerts:** `volteryde/telematics/live/all/alert`

## 4. Backend Implementation (NestJS - `volteryde-nest` service)

The `volteryde-nest` service, specifically the `TelematicsModule`, has been refactored to use MQTT.

*   **`mqtt` Package:** The `mqtt` npm package has been added as a dependency.
*   **`MqttService` (`src/mqtt/mqtt.service.ts`):**
    *   A new injectable service responsible for managing the MQTT client connection, publishing messages, and subscribing to topics.
    *   Connects to the MQTT broker using the `MQTT_BROKER_URL` environment variable (e.g., `mqtt://mosquitto:1883` for local, AWS IoT Core endpoint for production).
    *   Handles connection lifecycle events (connect, error, close, reconnect).
*   **`MqttModule` (`src/mqtt/mqtt.module.ts`):**
    *   A global NestJS module that provides and exports the `MqttService`.
*   **`TelematicsModule` (`src/telematics/telematics.module.ts`):**
    *   Imports `MqttModule` and `ConfigModule`.
*   **`TelematicsService` (`src/telematics/services/telematics.service.ts`):**
    *   Injects `MqttService`.
    *   The `updateLocation` method now publishes location data to the relevant MQTT topics (`volteryde/telematics/live/vehicle/<vehicleId>/location` and `volteryde/telematics/live/all/location`) instead of broadcasting via `socket.io`.
    *   New methods `broadcastDiagnosticsUpdate` and `broadcastAlert` have been added to publish diagnostics and alert data to their respective MQTT topics.
*   **`TelematicsGateway` (`src/telematics/gateways/telematics.gateway.ts`):**
    *   This WebSocket gateway has been removed as its functionality is now replaced by MQTT.

## 5. Frontend Implementation (React - `admin-dashboard`)

The `admin-dashboard` application has been updated to consume real-time data via MQTT.

*   **`mqtt` Package:** The `mqtt` npm package has been added as a dependency.
*   **`useMqtt` Hook (`app/hooks/useMqtt.ts`):**
    *   A custom React hook that encapsulates the MQTT client logic.
    *   Manages connection to the MQTT broker (using `ws://localhost:9001` for local development and `import.meta.env.VITE_MQTT_BROKER_URL_PROD` for production).
    *   Provides `isConnected` status, a list of `messages`, and functions for `publish`, `subscribe`, and `unsubscribe`.
*   **`App` Component (`app/root.tsx`):**
    *   Integrates the `useMqtt` hook.
    *   Subscribes to `volteryde/telematics/live/all/location`, `volteryde/telematics/live/all/diagnostics`, and `volteryde/telematics/live/all/alert` topics when connected.
    *   Displays the connection status and the latest received MQTT message for demonstration purposes.

## 6. Infrastructure Configuration

*   **`docker-compose.yml`:**
    *   A `mosquitto` service has been added for local development, exposing standard MQTT (1883) and MQTT over WebSockets (9001) ports.
    *   The `nestjs-backend` service now includes an `MQTT_BROKER_URL` environment variable pointing to `mqtt://mosquitto:1883`.
*   **`infrastructure/docker/mosquitto.conf`:**
    *   Configuration file for the Mosquitto broker, enabling anonymous access and WebSocket protocol on port 9001.
*   **Kubernetes Manifests (`infrastructure/kubernetes`):**
    *   For production deployments, Kubernetes manifests will need to be updated to deploy and configure AWS IoT Core endpoints or a self-hosted MQTT broker (e.g., EMQX, Mosquitto) if AWS IoT Core is not used. This typically involves configuring IAM roles, policies, and endpoint URLs.

## 7. Monitoring and Logging

*   **Mosquitto (Local):** Logs are directed to `stdout` and can be viewed using `docker logs volteryde-mosquitto`.
*   **AWS IoT Core (Production):** Integrates with AWS CloudWatch for metrics and detailed logging.
*   **NestJS Backend:** Uses NestJS's built-in `Logger` for MQTT client events, which can be integrated with CloudWatch Logs or other logging solutions.
*   **Frontend Applications:** The `useMqtt` hook logs to the browser console. In production, these should be integrated with client-side error tracking and logging tools.

## 8. Testing Instructions

To verify the MQTT implementation locally:

1.  **Start the Local Development Environment:**
    *   In the project root: `docker-compose up --build -d`
    *   In `apps/admin-dashboard`: `pnpm dev`
2.  **Verify MQTT Broker Connectivity:**
    *   Check `docker logs volteryde-mosquitto`.
    *   (Optional) Use an MQTT client tool to connect to `mqtt://localhost:1883` and subscribe to `volteryde/telematics/live/#`.
3.  **Verify NestJS Publishing:**
    *   Trigger a location update via the NestJS API (e.g., `curl -X POST http://localhost:3000/telematics/location -H "Content-Type: application/json" -d '{"vehicleId": "TEST-VEHICLE-001", "latitude": 34.052235, "longitude": -118.243683, "speed": 60, "heading": 90, "accuracy": 5}'`).
    *   Observe `docker logs volteryde-nestjs` and your MQTT client tool for published messages.
4.  **Verify Frontend Subscription and Display:**
    *   Open `http://localhost:3000` (or your admin dashboard URL) in a browser.
    *   Check the browser console for MQTT connection logs.
    *   Observe the "Latest MQTT Message" section on the dashboard UI for incoming telematics data.
