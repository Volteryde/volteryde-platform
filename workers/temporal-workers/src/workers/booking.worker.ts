// ============================================================================
// Temporal Worker for Volteryde Booking Workflows
// ============================================================================
// This worker polls the Temporal server for tasks and executes workflows

import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../activities/booking.activities';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config();

/**
 * Main worker function
 * Creates and runs a Temporal worker that processes booking workflows
 */
async function run() {
  console.log('='.repeat(70));
  console.log('Volteryde Temporal Worker - Starting...');
  console.log('='.repeat(70));

  // Get configuration from environment
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'volteryde-booking';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

  console.log(`Temporal Server: ${temporalAddress}`);
  console.log(`Task Queue: ${taskQueue}`);
  console.log(`Namespace: ${namespace}`);
  console.log('');

  try {
    // Create connection to Temporal server
    const connection = await NativeConnection.connect({
      address: temporalAddress,
    });

    console.log('✓ Connected to Temporal server');

    // Create the worker
    const worker = await Worker.create({
      connection,
      namespace,
      taskQueue,
      // Point to the compiled workflows directory
      workflowsPath: resolve(__dirname, '../workflows'),
      // Register all activity functions
      activities,
      // Worker configuration
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 10,
    });

    console.log('✓ Worker created successfully');
    console.log('');
    console.log('='.repeat(70));
    console.log('Worker is ready and polling for tasks...');
    console.log('Press Ctrl+C to stop');
    console.log('='.repeat(70));
    console.log('');

    // Start polling for tasks
    await worker.run();

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('Worker Error:');
    console.error('='.repeat(70));
    console.error(error);
    console.error('');
    
    if (error instanceof Error) {
      if (error.message.includes('Connection refused')) {
        console.error('❌ Could not connect to Temporal server');
        console.error('');
        console.error('Make sure the Temporal server is running:');
        console.error('  - Docker Compose: docker-compose up temporal');
        console.error('  - Homebrew: temporal server start-dev');
        console.error('');
      }
    }
    
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('='.repeat(70));
  console.log('Shutting down worker gracefully...');
  console.log('='.repeat(70));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('='.repeat(70));
  console.log('Shutting down worker gracefully...');
  console.log('='.repeat(70));
  process.exit(0);
});

// Run the worker
run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
