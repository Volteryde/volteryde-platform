#!/usr/bin/env ts-node
// ============================================================================
// H3 Index Backfill Script
// ============================================================================
// Austin: CLI script to backfill H3 indices for existing stops
// Run with: npx ts-node scripts/backfill-h3-indices.ts
// Or add to package.json: "backfill:h3-indices": "ts-node scripts/backfill-h3-indices.ts"

import * as h3 from 'h3-js';

// Austin: H3 Resolution constants
const H3Resolution = {
  PICKUP_POINT: 10,
  DRIVER_DISCOVERY: 8,
  SHARD: 6,
};

/**
 * Austin: Backfill H3 indices for all stops in the database
 * This script can be run standalone or integrated with the migration
 */
async function backfillH3Indices(): Promise<void> {
  console.log('🚀 Starting H3 Index Backfill...\n');

  // Austin: This would typically use TypeORM or Prisma to query the database
  // For now, we'll provide the SQL queries that need to be run

  console.log('📋 Run the following SQL queries to backfill H3 indices:\n');

  // Austin: Option 1 - With h3-pg extension installed
  console.log('OPTION 1: Using h3-pg PostgreSQL extension (faster)');
  console.log('---------------------------------------------------');
  console.log(`
-- First, install h3-pg extension (if not installed)
CREATE EXTENSION IF NOT EXISTS h3;

-- Backfill H3 indices for all stops
UPDATE gtfs_stops
SET 
  "h3Res10" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 10)::bigint,
  "h3Res8" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 8)::bigint,
  "h3Res6" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 6)::bigint,
  "accessH3Index" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 10)::bigint
WHERE "stopLat" IS NOT NULL AND "stopLon" IS NOT NULL;

-- Verify backfill
SELECT COUNT(*) as total_stops, COUNT("h3Res10") as indexed_stops FROM gtfs_stops;
  `);

  console.log('\nOPTION 2: Using application-level backfill (JavaScript)');
  console.log('--------------------------------------------------------');
  console.log('Run this script with database connection:');

  // Austin: Demonstrate how H3 indices are calculated
  const sampleLat = 5.6037;  // Accra, Ghana
  const sampleLon = -0.1870;

  const h3Res10 = h3.latLngToCell(sampleLat, sampleLon, H3Resolution.PICKUP_POINT);
  const h3Res8 = h3.latLngToCell(sampleLat, sampleLon, H3Resolution.DRIVER_DISCOVERY);
  const h3Res6 = h3.latLngToCell(sampleLat, sampleLon, H3Resolution.SHARD);

  console.log(`
Sample calculation for Accra (${sampleLat}, ${sampleLon}):
- h3Res10 (Pickup):    ${h3Res10}
- h3Res8  (Discovery): ${h3Res8}
- h3Res6  (Shard):     ${h3Res6}
  `);

  // Austin: Provide TypeORM-based backfill example
  console.log('\nTypeORM Backfill Example:');
  console.log('-------------------------');
  console.log(`
import { DataSource } from 'typeorm';
import * as h3 from 'h3-js';
import { Stop } from './gtfs/entities/stop.entity';

async function backfill(dataSource: DataSource) {
  const stopRepo = dataSource.getRepository(Stop);
  
  // Fetch stops without H3 indices
  const stops = await stopRepo.find({
    where: [
      { h3Res10: null },
      { h3Res10: undefined },
    ],
  });
  
  console.log(\`Found \${stops.length} stops to backfill\`);
  
  for (const stop of stops) {
    stop.h3Res10 = h3.latLngToCell(stop.stopLat, stop.stopLon, 10);
    stop.h3Res8 = h3.latLngToCell(stop.stopLat, stop.stopLon, 8);
    stop.h3Res6 = h3.latLngToCell(stop.stopLat, stop.stopLon, 6);
    stop.accessH3Index = stop.h3Res10;
    
    await stopRepo.save(stop);
  }
  
  console.log(\`Backfilled \${stops.length} stops\`);
}
  `);

  console.log('\n✅ Backfill instructions complete!');
  console.log('Run the SQL or TypeORM example based on your setup.\n');
}

// Run the script
backfillH3Indices().catch((error) => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});
