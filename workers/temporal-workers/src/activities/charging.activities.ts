// ============================================================================
// Charging Activities for Temporal Workflows
// ============================================================================

import axios from 'axios';
import { StartChargingSessionRequest, ChargingSession } from '../interfaces';

// Get service URLs from environment variables
const NESTJS_API_URL = process.env.NESTJS_API_URL || 'http://localhost:3000';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'dev-internal-key';

/**
 * Activity: Start a charging session via Internal API
 */
export async function startChargingSessionActivity(request: StartChargingSessionRequest): Promise<ChargingSession> {
  console.log(`[ACTIVITY] Starting charging session for vehicle ${request.vehicleId} at station ${request.stationId}`);

  try {
    // Call the NestJS Charging Internal API
    const response = await axios.post(
      `${NESTJS_API_URL}/api/v1/charging/internal/sessions/start`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        },
        timeout: 10000,
      }
    );

    const session: ChargingSession = response.data;
    console.log(`[ACTIVITY] Charging session started: ${session.id}`);
    return session;
  } catch (error) {
    console.error(`[ACTIVITY] Failed to start charging session:`, error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to start charging session: ${message}`);
    }
    throw new Error(`Failed to start charging session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
