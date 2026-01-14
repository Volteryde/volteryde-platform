// ============================================================================
// Migration: Add H3 Spatial Indices to Stops
// ============================================================================
// Austin: This migration adds H3 hexagonal spatial indexing columns to the
// gtfs_stops table for O(1) proximity queries. Part of Phase 2 implementation.
// Reference: Architecture Spec Section 2 - H3 Resolution Strategy

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddH3IndicesToStops1736700000000 implements MigrationInterface {
  name = 'AddH3IndicesToStops1736700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Austin: Add H3 index columns at multiple resolutions
    // Resolution 10 (~66m) - Primary operating resolution for pickup points
    // Resolution 8 (~460m) - Driver discovery radius
    // Resolution 6 (~3.2km) - Database sharding key

    await queryRunner.addColumns('gtfs_stops', [
      new TableColumn({
        name: 'h3Res10',
        type: 'bigint',
        isNullable: true,
        comment: 'H3 index at Resolution 10 (~66m) - Primary pickup point resolution',
      }),
      new TableColumn({
        name: 'h3Res8',
        type: 'bigint',
        isNullable: true,
        comment: 'H3 index at Resolution 8 (~460m) - Driver discovery radius',
      }),
      new TableColumn({
        name: 'h3Res6',
        type: 'bigint',
        isNullable: true,
        comment: 'H3 index at Resolution 6 (~3.2km) - Sharding key',
      }),
      new TableColumn({
        name: 'accessH3Index',
        type: 'bigint',
        isNullable: true,
        comment: 'H3 index of street access point (may differ from physical location)',
      }),
      new TableColumn({
        name: 'accessGrade',
        type: 'enum',
        enum: ['CURB', 'BAY', 'TERMINAL'],
        default: "'CURB'",
        comment: 'Access type affecting dwell time calculations',
      }),
      new TableColumn({
        name: 'isActiveForPickup',
        type: 'boolean',
        default: true,
        comment: 'Whether this stop is valid for VolteRyde pickups',
      }),
      new TableColumn({
        name: 'safetyScore',
        type: 'integer',
        isNullable: true,
        default: 50,
        comment: 'Safety score (0-100) for smart snap cost function',
      }),
    ]);

    // Austin: Create B-tree indices for fast equality lookups on H3 cells
    await queryRunner.createIndex(
      'gtfs_stops',
      new TableIndex({
        name: 'idx_stop_h3_res10',
        columnNames: ['h3Res10'],
      }),
    );

    await queryRunner.createIndex(
      'gtfs_stops',
      new TableIndex({
        name: 'idx_stop_h3_res8',
        columnNames: ['h3Res8'],
      }),
    );

    // Austin: Composite index for active pickup stops (common query pattern)
    await queryRunner.createIndex(
      'gtfs_stops',
      new TableIndex({
        name: 'idx_stop_active_pickup',
        columnNames: ['isActiveForPickup', 'h3Res10'],
        where: '"isActiveForPickup" = true',
      }),
    );

    console.log('✅ H3 spatial indices added to gtfs_stops table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Austin: Remove indices first
    await queryRunner.dropIndex('gtfs_stops', 'idx_stop_active_pickup');
    await queryRunner.dropIndex('gtfs_stops', 'idx_stop_h3_res8');
    await queryRunner.dropIndex('gtfs_stops', 'idx_stop_h3_res10');

    // Austin: Remove columns
    await queryRunner.dropColumn('gtfs_stops', 'safetyScore');
    await queryRunner.dropColumn('gtfs_stops', 'isActiveForPickup');
    await queryRunner.dropColumn('gtfs_stops', 'accessGrade');
    await queryRunner.dropColumn('gtfs_stops', 'accessH3Index');
    await queryRunner.dropColumn('gtfs_stops', 'h3Res6');
    await queryRunner.dropColumn('gtfs_stops', 'h3Res8');
    await queryRunner.dropColumn('gtfs_stops', 'h3Res10');

    // Austin: Drop the enum type
    await queryRunner.query('DROP TYPE IF EXISTS "gtfs_stops_accessgrade_enum"');

    console.log('✅ H3 spatial indices removed from gtfs_stops table');
  }
}
