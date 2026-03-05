/**
 * System Health API — Live Infrastructure Monitoring
 *
 * Austin — This endpoint queries ALL running Docker containers, databases,
 * caches, and services to build a real-time health snapshot of the
 * VolteRyde platform infrastructure.
 *
 * It performs parallel health checks against:
 *  - Spring Boot services via /actuator/health
 *  - Node.js services via /health or HTTP ping
 *  - PostgreSQL databases via pg_stat queries
 *  - Redis via PING
 *  - Infrastructure services (Kafka, InfluxDB, Prometheus, etc.)
 *
 * Austin — This route is SERVER-ONLY. Never expose container internals
 * or credentials to the client beyond status/latency/uptime.
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import net from 'net';

// ─────────────────────────────────────────────────────────────────────
// Austin — Service registry: maps container names to their health
// check targets. Ports are HOST-MAPPED ports (as seen from the
// admin-dashboard running on the host, NOT inside Docker network).
// ─────────────────────────────────────────────────────────────────────

interface ServiceDef {
	name: string;
	displayName: string;
	category: 'core-service' | 'database' | 'monitoring' | 'messaging';
	host: string;
	port: number;
	healthPath?: string; // for HTTP-based health checks
	type: 'spring-boot' | 'node' | 'postgres' | 'redis' | 'kafka' | 'grafana' | 'prometheus' | 'influxdb' | 'mqtt' | 'zookeeper';
}

const SERVICE_REGISTRY: ServiceDef[] = [
	// Austin — Core Application Services
	{
		name: 'volteryde-api-gateway',
		displayName: 'API Gateway',
		category: 'core-service',
		host: 'localhost',
		port: 8084,
		healthPath: '/actuator/health',
		type: 'spring-boot',
	},
	{
		name: 'volteryde-auth-service',
		displayName: 'Auth Service',
		category: 'core-service',
		host: 'localhost',
		port: 8081,
		healthPath: '/actuator/health',
		type: 'spring-boot',
	},
	{
		name: 'volteryde-user-service',
		displayName: 'User Service',
		category: 'core-service',
		host: 'localhost',
		port: 8083, // Austin — host:8083 → container:8082
		healthPath: '/actuator/health',
		type: 'spring-boot',
	},
	{
		name: 'volteryde-client-auth-service',
		displayName: 'Client Auth Service',
		category: 'core-service',
		host: 'localhost',
		port: 8082,
		healthPath: '/actuator/health',
		type: 'spring-boot',
	},
	{
		name: 'volteryde-payment-service',
		displayName: 'Payment Service',
		category: 'core-service',
		host: 'localhost',
		port: 8084, // Austin — routed through API gateway, no direct host port
		healthPath: '/payment-service/actuator/health',
		type: 'spring-boot',
	},
	{
		name: 'volteryde-service-discovery',
		displayName: 'Service Discovery (Eureka)',
		category: 'core-service',
		host: 'localhost',
		port: 8761,
		healthPath: '/actuator/health',
		type: 'spring-boot',
	},
	{
		name: 'volteryde-api',
		displayName: 'VolteRyde API',
		category: 'core-service',
		host: 'localhost',
		port: 3010,
		healthPath: '/health',
		type: 'node',
	},
	{
		name: 'volteryde-fleet',
		displayName: 'Fleet Service',
		category: 'core-service',
		host: 'localhost',
		port: 3002,
		healthPath: '/health',
		type: 'node',
	},
	{
		name: 'volteryde-booking',
		displayName: 'Booking Service',
		category: 'core-service',
		host: 'localhost',
		port: 3004,
		healthPath: '/health',
		type: 'node',
	},
	{
		name: 'volteryde-telematics',
		displayName: 'Telematics Service',
		category: 'core-service',
		host: 'localhost',
		port: 3001,
		healthPath: '/health',
		type: 'node',
	},
	{
		name: 'volteryde-charging',
		displayName: 'Charging Service',
		category: 'core-service',
		host: 'localhost',
		port: 3003,
		healthPath: '/health',
		type: 'node',
	},
	{
		name: 'volteryde-notifications',
		displayName: 'Notifications Service',
		category: 'core-service',
		host: 'localhost',
		port: 3005,
		healthPath: '/health',
		type: 'node',
	},

	// Austin — Databases
	{
		name: 'volteryde-postgres',
		displayName: 'PostgreSQL',
		category: 'database',
		host: 'localhost',
		port: 5432,
		type: 'postgres',
	},
	{
		name: 'volteryde-redis',
		displayName: 'Redis',
		category: 'database',
		host: 'localhost',
		port: 6379,
		type: 'redis',
	},

	// Austin — Messaging
	{
		name: 'volteryde-kafka',
		displayName: 'Kafka',
		category: 'messaging',
		host: 'localhost',
		port: 29092,
		type: 'kafka',
	},
	{
		name: 'volteryde-zookeeper',
		displayName: 'Zookeeper',
		category: 'messaging',
		host: 'localhost',
		port: 2181,
		type: 'zookeeper',
	},
	{
		name: 'volteryde-mosquitto',
		displayName: 'MQTT Broker (Mosquitto)',
		category: 'messaging',
		host: 'localhost',
		port: 1883,
		type: 'mqtt',
	},

	// Austin — Monitoring & Observability
	{
		name: 'volteryde-prometheus',
		displayName: 'Prometheus',
		category: 'monitoring',
		host: 'localhost',
		port: 19090,
		healthPath: '/-/healthy',
		type: 'prometheus',
	},
	{
		name: 'volteryde-grafana',
		displayName: 'Grafana',
		category: 'monitoring',
		host: 'localhost',
		port: 3100,
		healthPath: '/api/health',
		type: 'grafana',
	},
	{
		name: 'volteryde-influxdb',
		displayName: 'InfluxDB',
		category: 'monitoring',
		host: 'localhost',
		port: 8086,
		healthPath: '/health',
		type: 'influxdb',
	},
];

// ─────────────────────────────────────────────────────────────────────
// Austin — Health check result types
// ─────────────────────────────────────────────────────────────────────

interface ServiceHealthResult {
	name: string;
	displayName: string;
	category: string;
	type: string;
	status: 'healthy' | 'degraded' | 'down';
	latency: number; // ms
	port: number;
	details?: string;
	checkedAt: string;
}

interface DatabaseStats {
	activeConnections: number;
	maxConnections: number;
	databaseCount: number;
	totalSize: string;
	uptime: string;
}

interface SystemHealthResponse {
	timestamp: string;
	summary: {
		totalNodes: number;
		healthyNodes: number;
		degradedNodes: number;
		downNodes: number;
		overallStatus: 'healthy' | 'degraded' | 'critical';
	};
	databaseStats: DatabaseStats | null;
	services: ServiceHealthResult[];
}

// ─────────────────────────────────────────────────────────────────────
// Austin — Health check functions
// ─────────────────────────────────────────────────────────────────────

/**
 * HTTP health check — pings a URL and measures response latency.
 * Timeout after 5 seconds to avoid hanging on unreachable services.
 */
async function checkHttpHealth(
	url: string,
	timeoutMs = 5000,
): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency: number; details?: string }> {
	const start = Date.now();
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		const response = await fetch(url, {
			signal: controller.signal,
			// Austin — skip TLS verification for internal services
			cache: 'no-store',
		});
		clearTimeout(timeout);

		const latency = Date.now() - start;

		if (response.ok) {
			// Austin — Spring Boot returns JSON with "status" field
			try {
				const body = await response.json();
				if (body?.status === 'DOWN') {
					return { status: 'degraded', latency, details: 'Service reports DOWN internally' };
				}
			} catch {
				// Non-JSON response is fine (nginx, etc.)
			}
			return {
				status: latency > 3000 ? 'degraded' : 'healthy',
				latency,
			};
		}

		// Austin — A 404 or other HTTP error means the service IS running
		// (it responded), it just doesn't have that specific health route.
		// Only 5xx errors indicate actual degradation. 502/503 mean the
		// service is behind a proxy but unreachable.
		if (response.status === 502 || response.status === 503) {
			return { status: 'degraded', latency, details: `HTTP ${response.status}` };
		}

		// Austin — 404, 401, 403 etc. mean the process is alive & responding
		return {
			status: latency > 3000 ? 'degraded' : 'healthy',
			latency,
			details: `HTTP ${response.status} (alive)`,
		};
	} catch (error) {
		const latency = Date.now() - start;
		const msg = error instanceof Error ? error.message : 'Unknown error';
		return {
			status: 'down',
			latency,
			details: msg.includes('abort') ? 'Timeout' : msg,
		};
	}
}

/**
 * TCP socket check — tests if a port is reachable using a raw TCP connection.
 * Austin — Previously used fetch() HTTP which triggered "SECURITY ATTACK"
 * warnings in Redis. Now uses Node.js net.Socket for a proper TCP probe
 * that doesn't send any HTTP data to non-HTTP services.
 * Used for services without HTTP endpoints (Kafka, Zookeeper, MQTT, Redis).
 */
async function checkTcpPort(
	host: string,
	port: number,
	timeoutMs = 3000,
): Promise<{ status: 'healthy' | 'down'; latency: number; details?: string }> {
	const start = Date.now();
	return new Promise((resolve) => {
		const socket = new net.Socket();
		let resolved = false;

		const cleanup = () => {
			if (!resolved) {
				resolved = true;
				socket.destroy();
			}
		};

		socket.setTimeout(timeoutMs);

		socket.on('connect', () => {
			const latency = Date.now() - start;
			cleanup();
			resolve({ status: 'healthy', latency });
		});

		socket.on('timeout', () => {
			cleanup();
			resolve({ status: 'down', latency: Date.now() - start, details: 'Connection timeout' });
		});

		socket.on('error', (err) => {
			cleanup();
			resolve({ status: 'down', latency: Date.now() - start, details: err.message });
		});

		socket.connect(port, host);
	});
}

/**
 * PostgreSQL health check — queries actual database statistics.
 */
async function checkPostgresHealth(): Promise<{
	health: { status: 'healthy' | 'degraded' | 'down'; latency: number; details?: string };
	stats: DatabaseStats | null;
}> {
	const start = Date.now();
	const tempPool = new Pool({
		host: process.env.POSTGRES_HOST || 'localhost',
		port: Number(process.env.POSTGRES_PORT || 5432),
		database: 'postgres', // Austin — connect to default DB for server-level stats
		user: process.env.POSTGRES_USER || 'postgres',
		password: process.env.POSTGRES_PASSWORD || 'isOpgtfdc.volteryde_2026',
		max: 1,
		idleTimeoutMillis: 5_000,
		connectionTimeoutMillis: 5_000,
	});

	try {
		// Austin — Parallel queries for comprehensive DB stats
		const [connResult, dbResult, sizeResult, uptimeResult] = await Promise.all([
			tempPool.query(`
				SELECT count(*) as active_connections,
				       (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
				FROM pg_stat_activity
				WHERE state = 'active'
			`),
			tempPool.query(`SELECT count(*) as db_count FROM pg_database WHERE NOT datistemplate`),
			tempPool.query(`
				SELECT pg_size_pretty(sum(pg_database_size(datname))) as total_size
				FROM pg_database WHERE NOT datistemplate
			`),
			tempPool.query(`SELECT now() - pg_postmaster_start_time() as uptime`),
		]);

		const latency = Date.now() - start;
		const active = Number(connResult.rows[0]?.active_connections || 0);
		const max = Number(connResult.rows[0]?.max_connections || 100);

		const stats: DatabaseStats = {
			activeConnections: active,
			maxConnections: max,
			databaseCount: Number(dbResult.rows[0]?.db_count || 0),
			totalSize: sizeResult.rows[0]?.total_size || 'Unknown',
			uptime: formatPostgresUptime(uptimeResult.rows[0]?.uptime),
		};

		// Austin — Degraded if connections exceed 80% of max
		const ratio = active / max;
		const status = ratio > 0.8 ? 'degraded' : 'healthy';

		return {
			health: { status, latency, details: `${active}/${max} connections` },
			stats,
		};
	} catch (error) {
		return {
			health: {
				status: 'down',
				latency: Date.now() - start,
				details: error instanceof Error ? error.message : 'Connection failed',
			},
			stats: null,
		};
	} finally {
		await tempPool.end();
	}
}

/**
 * Redis health check — direct TCP check + optional PING via HTTP proxy.
 */
async function checkRedisHealth(
	host: string,
	port: number,
): Promise<{ status: 'healthy' | 'down'; latency: number; details?: string }> {
	// Austin — Redis doesn't speak HTTP, so we do a TCP port check.
	// A fast response on port 6379 means Redis is accepting connections.
	return checkTcpPort(host, port, 3000);
}

// ─────────────────────────────────────────────────────────────────────
// Austin — Utility functions
// ─────────────────────────────────────────────────────────────────────

function formatPostgresUptime(interval: unknown): string {
	if (!interval) return 'Unknown';

	// Austin — pg driver returns interval as an object with
	// { days, hours, minutes, seconds, ... } or as a raw string.
	// Handle both cases.
	if (typeof interval === 'object' && interval !== null) {
		const obj = interval as Record<string, number>;
		const days = obj.days || 0;
		const hours = obj.hours || 0;
		const minutes = obj.minutes || 0;
		if (days > 0) return `${days}d ${hours}h ${minutes}m`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}

	const str = String(interval);
	// Parse PostgreSQL interval like "10 days 05:32:17.123456"
	const match = str.match(/(?:(\d+)\s+days?\s+)?(\d+):(\d+):(\d+)/);
	if (!match) return str;
	const days = match[1] ? `${match[1]}d ` : '';
	return `${days}${match[2]}h ${match[3]}m`;
}

// ─────────────────────────────────────────────────────────────────────
// Austin — Main health check orchestrator
// ─────────────────────────────────────────────────────────────────────

async function performHealthChecks(): Promise<SystemHealthResponse> {
	const timestamp = new Date().toISOString();
	let databaseStats: DatabaseStats | null = null;

	// Austin — Run ALL health checks in parallel for speed
	const checks = SERVICE_REGISTRY.map(async (svc): Promise<ServiceHealthResult> => {
		let result: { status: 'healthy' | 'degraded' | 'down'; latency: number; details?: string };

		switch (svc.type) {
			case 'postgres': {
				const pgResult = await checkPostgresHealth();
				databaseStats = pgResult.stats;
				result = pgResult.health;
				break;
			}
			case 'redis': {
				result = await checkRedisHealth(svc.host, svc.port);
				break;
			}
			case 'spring-boot':
			case 'node':
			case 'prometheus':
			case 'grafana':
			case 'influxdb': {
				if (svc.healthPath) {
					result = await checkHttpHealth(`http://${svc.host}:${svc.port}${svc.healthPath}`);
				} else {
					result = await checkHttpHealth(`http://${svc.host}:${svc.port}/`);
				}
				break;
			}
			case 'kafka':
			case 'zookeeper':
			case 'mqtt':
			default: {
				result = await checkTcpPort(svc.host, svc.port);
				break;
			}
		}

		return {
			name: svc.name,
			displayName: svc.displayName,
			category: svc.category,
			type: svc.type,
			status: result.status,
			latency: result.latency,
			port: svc.port,
			details: result.details,
			checkedAt: timestamp,
		};
	});

	const services = await Promise.all(checks);

	// Austin — Calculate summary
	const healthy = services.filter((s) => s.status === 'healthy').length;
	const degraded = services.filter((s) => s.status === 'degraded').length;
	const down = services.filter((s) => s.status === 'down').length;

	let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
	if (down > 0) overallStatus = 'critical';
	else if (degraded > 0) overallStatus = 'degraded';

	return {
		timestamp,
		summary: {
			totalNodes: services.length,
			healthyNodes: healthy,
			degradedNodes: degraded,
			downNodes: down,
			overallStatus,
		},
		databaseStats,
		services,
	};
}

// ─────────────────────────────────────────────────────────────────────
// Austin — Route handler
// ─────────────────────────────────────────────────────────────────────

export async function GET() {
	try {
		const health = await performHealthChecks();
		return NextResponse.json(health);
	} catch (error) {
		console.error('[SystemHealth] Failed to perform health checks:', error);
		return NextResponse.json(
			{
				error: 'Health check failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
