/**
 * PostgreSQL connection pool for admin-dashboard server-side routes.
 *
 * Austin — This module is SERVER-ONLY. It connects directly to the
 * VolteRyde Postgres instance so admin API routes can query financial
 * data across service schemas (svc_payment, svc_booking, etc.).
 *
 * Connection details are sourced from env vars that match the
 * central .env at the platform root.
 */

import { Pool } from 'pg';

// Austin — singleton pool; reused across hot-reloads in dev
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

function createPool(): Pool {
	return new Pool({
		host: process.env.POSTGRES_HOST || 'localhost',
		port: Number(process.env.POSTGRES_PORT || 5432),
		database: process.env.POSTGRES_DB || 'payment_db',
		user: process.env.POSTGRES_USER || 'postgres',
		password: process.env.POSTGRES_PASSWORD || 'isOpgtfdc.volteryde_2026',
		max: 5, // small pool — admin queries only
		idleTimeoutMillis: 30_000,
		connectionTimeoutMillis: 5_000,
	});
}

export const pool = globalForPg._pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
	// Preserve pool across Next.js dev hot-reloads
	globalForPg._pgPool = pool;
}

/**
 * Helper: run a query against a specific database.
 * Creates a one-off client with the given `database` name.
 *
 * Austin — use this when a query needs to target a database different
 * from the default pool (e.g. booking_db vs payment_db).
 */
export async function queryDatabase(
	database: string,
	text: string,
	params?: unknown[],
) {
	const client = new Pool({
		host: process.env.POSTGRES_HOST || 'localhost',
		port: Number(process.env.POSTGRES_PORT || 5432),
		database,
		user: process.env.POSTGRES_USER || 'postgres',
		password: process.env.POSTGRES_PASSWORD || 'isOpgtfdc.volteryde_2026',
		max: 1,
		idleTimeoutMillis: 5_000,
		connectionTimeoutMillis: 5_000,
	});

	try {
		const result = await client.query(text, params);
		return result;
	} finally {
		await client.end();
	}
}
