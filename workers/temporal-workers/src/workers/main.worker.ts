// ============================================================================
// Temporal Worker for Volteryde Workflows
// ============================================================================
// This worker polls the Temporal server for tasks and executes workflows

import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../activities'; // Import from index to get all activities
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config();

/**
 * Main worker function
 * Creates and runs a Temporal worker that processes all workflows
 */
async function run() {
  console.log('='.repeat(70));
  console.log('Volteryde Temporal Worker - Starting...');
  console.log('='.repeat(70));

  // Get configuration from environment
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  // Use a generic task queue or allow multiple?
  // For simplicity, we might listen on multiple, or just one generic one.
  // The Booking service uses 'volteryde-booking'.
  // The Charging service uses 'volteryde-charging'.
  // One worker instance can only listen to one task queue usually unless we create multiple Workers.

  const bookingTaskQueue = process.env.TEMPORAL_BOOKING_TASK_QUEUE || 'volteryde-booking';
  const chargingTaskQueue = process.env.TEMPORAL_CHARGING_TASK_QUEUE || 'volteryde-charging';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

  console.log(`Temporal Server: ${temporalAddress}`);
  console.log(`Namespace: ${namespace}`);
  console.log('');

  try {
    // Get configuration for Temporal Cloud
    const apiKey = process.env.TEMPORAL_API_KEY;
    const clientCertPath = process.env.TEMPORAL_CLIENT_CERT;
    const clientKeyPath = process.env.TEMPORAL_CLIENT_KEY;

    // Create connection options
    const connectionOptions: any = {
      address: temporalAddress,
    };

    if (apiKey) {
      connectionOptions.tls = true;
      connectionOptions.apiKey = apiKey;
    } else if (clientCertPath && clientKeyPath) {
      const { readFile } = await import('fs/promises');
      const cert = await readFile(clientCertPath);
      const key = await readFile(clientKeyPath);

      connectionOptions.tls = {
        clientCertPair: { crt: cert, key: key },
      };
    }

    const connection = await NativeConnection.connect(connectionOptions);
    console.log('✓ Connected to Temporal server');

    // Create Booking Worker
    const bookingWorker = await Worker.create({
      connection,
      namespace,
      taskQueue: bookingTaskQueue,
      workflowsPath: resolve(__dirname, '../workflows'),
      activities,
    });

    // Create Charging Worker
    // Note: In production, these might be separate deployments, but for dev/monorepo validation,
    // running them in one process is fine.
    const chargingWorker = await Worker.create({
      connection,
      namespace,
      taskQueue: chargingTaskQueue,
      workflowsPath: resolve(__dirname, '../workflows'),
      activities,
    });

    console.log(`✓ Workers created for queues: ${bookingTaskQueue}, ${chargingTaskQueue}`);
    console.log('');
    console.log('='.repeat(70));
    console.log('Workers are ready and polling for tasks...');
    console.log('Press Ctrl+C to stop');
    console.log('='.repeat(70));
    console.log('');

    // Start polling for tasks
    await Promise.all([
      bookingWorker.run(),
      chargingWorker.run(),
    ]);

  } catch (error) {
    console.error('Worker Error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down worker gracefully...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Run the worker
run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
