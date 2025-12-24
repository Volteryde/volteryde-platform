// ============================================================================
// Charging Workflow for Volteryde Platform
// ============================================================================

import { proxyActivities, workflowInfo } from '@temporalio/workflow';
import type * as activities from '../activities/charging.activities';
import { StartChargingSessionRequest, ChargingSession } from '../interfaces';

// Activity Proxies
const { startChargingSessionActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    maximumInterval: '10 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

/**
 * Charge Vehicle Workflow
 *
 * Orchestrates the charging session process.
 */
export async function chargeVehicleWorkflow(request: StartChargingSessionRequest): Promise<ChargingSession> {
  const info = workflowInfo();
  console.log(`[WORKFLOW] Starting charging workflow ${info.workflowId}`);

  try {
    // Step 1: Start Session (updates DB via Internal API)
    const session = await startChargingSessionActivity(request);

    // Future steps: Monitor progress, handle stop signal, process payment, etc.

    console.log(`[WORKFLOW] Charging session initiated successfully: ${session.id}`);
    return session;

  } catch (error) {
    console.error(`[WORKFLOW] Charging workflow failed:`, error);
    throw error;
  }
}
