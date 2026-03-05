/**
 * useSystemHealth — Live polling hook for system health data.
 *
 * Austin — Polls /api/system/health every 30 seconds by default.
 * Returns structured health data for all VolteRyde infrastructure
 * nodes including services, databases, and messaging layers.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────
// Austin — Types mirroring the API response shape
// ─────────────────────────────────────────────────────────────────────

export interface ServiceHealthResult {
	name: string;
	displayName: string;
	category: string;
	type: string;
	status: 'healthy' | 'degraded' | 'down';
	latency: number;
	port: number;
	details?: string;
	checkedAt: string;
}

export interface DatabaseStats {
	activeConnections: number;
	maxConnections: number;
	databaseCount: number;
	totalSize: string;
	uptime: string;
}

export interface SystemHealthSummary {
	totalNodes: number;
	healthyNodes: number;
	degradedNodes: number;
	downNodes: number;
	overallStatus: 'healthy' | 'degraded' | 'critical';
}

export interface SystemHealthData {
	timestamp: string;
	summary: SystemHealthSummary;
	databaseStats: DatabaseStats | null;
	services: ServiceHealthResult[];
}

interface UseSystemHealthReturn {
	data: SystemHealthData | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	lastUpdated: Date | null;
}

export function useSystemHealth(pollIntervalMs = 30_000): UseSystemHealthReturn {
	const [data, setData] = useState<SystemHealthData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const fetchHealth = useCallback(async () => {
		try {
			const response = await fetch('/api/system/health', { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`Health check failed: ${response.status}`);
			}
			const result: SystemHealthData = await response.json();
			setData(result);
			setError(null);
			setLastUpdated(new Date());
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch health data');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// Austin — Initial fetch
		fetchHealth();

		// Austin — Set up polling interval
		const interval = setInterval(fetchHealth, pollIntervalMs);
		return () => clearInterval(interval);
	}, [fetchHealth, pollIntervalMs]);

	return { data, loading, error, refresh: fetchHealth, lastUpdated };
}
