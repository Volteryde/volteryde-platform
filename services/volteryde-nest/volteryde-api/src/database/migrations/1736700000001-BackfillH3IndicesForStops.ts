// ============================================================================
// Migration: Backfill H3 Indices for Existing Stops
// ============================================================================
// Austin: This migration calculates and populates H3 indices for all existing
// stops in the database. Uses SQL function with h3-pg extension if available,
// otherwise falls back to application-level backfill.

import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillH3IndicesForStops1736700000001 implements MigrationInterface {
  name = 'BackfillH3IndicesForStops1736700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Austin: Check if h3-pg extension is available
    const h3ExtensionResult = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'h3'
      ) as has_h3;
    `);

    const hasH3Extension = h3ExtensionResult[0]?.has_h3;

    if (hasH3Extension) {
      // Austin: Use h3-pg extension for fast bulk update
      console.log('🔷 Using h3-pg extension for H3 index calculation');

      await queryRunner.query(`
        UPDATE gtfs_stops
        SET 
          "h3Res10" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 10)::bigint,
          "h3Res8" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 8)::bigint,
          "h3Res6" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 6)::bigint,
          "accessH3Index" = h3_lat_lng_to_cell(CAST("stopLat" AS double precision), CAST("stopLon" AS double precision), 10)::bigint
        WHERE "stopLat" IS NOT NULL AND "stopLon" IS NOT NULL;
      `);
    } else {
      // Austin: Fallback - Mark for application-level backfill
      console.log('⚠️  h3-pg extension not found. Run application-level backfill.');
      console.log('   Execute: pnpm run backfill:h3-indices');

      // Set a flag or log that backfill is needed
      // We'll create a backfill script separately
    }

    // Austin: Log statistics
    const stats = await queryRunner.query(`
      SELECT 
        COUNT(*) as total_stops,
        COUNT("h3Res10") as indexed_stops
      FROM gtfs_stops;
    `);

    console.log(`✅ H3 Backfill complete: ${stats[0].indexed_stops}/${stats[0].total_stops} stops indexed`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Austin: Clear H3 indices (don't drop columns, just null them)
    await queryRunner.query(`
      UPDATE gtfs_stops
      SET 
        "h3Res10" = NULL,
        "h3Res8" = NULL,
        "h3Res6" = NULL,
        "accessH3Index" = NULL;
    `);

    console.log('✅ H3 indices cleared from gtfs_stops');
  }
}
