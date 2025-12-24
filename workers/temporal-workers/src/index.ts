// ============================================================================
// Temporal Workers Entry Point
// ============================================================================
// This is the main entry point for all Temporal workers

export * from './interfaces';
export * from './activities';
export * from './workflows/booking.workflow';
export * from './workflows/charging.workflow';

// Start the worker when this file is run directly
if (require.main === module) {
  require('./workers/main.worker');
}
