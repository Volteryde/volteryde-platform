/**
 * useRevenueCharts — hook for fetching dashboard chart data.
 *
 * Austin — Single fetch from /api/metrics/revenue-charts powers all
 * three dashboard charts: SalesOverview, YearlyBreakup, MonthlyEarning.
 * Auto-refreshes every 5 minutes.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface RevenueChartData {
	// Austin — Dynamic year range from first transaction to current year
	availableYears: number[];
	revenueChart: {
		year: number;
		categories: string[];
		earnings: number[];
		expenses: number[];
	};
	yearlyBreakup: {
		years: string[];
		values: number[];
		total: number;
		yoyChangePercent: number;
	};
	monthlyEarnings: {
		labels: string[];
		data: number[];
		currentMonth: number;
		momChangePercent: number;
	};
	currency: string;
	queriedAt: string;
}

const REFRESH_INTERVAL_MS = 5 * 60_000; // 5 minutes

export function useRevenueCharts(year?: number) {
	const [data, setData] = useState<RevenueChartData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		try {
			const params = year ? `?year=${year}` : '';
			const res = await fetch(`/api/metrics/revenue-charts${params}`, {
				cache: 'no-store',
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || `HTTP ${res.status}`);
			}

			const json: RevenueChartData = await res.json();
			setData(json);
			setError(null);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load';
			setError(message);
			console.error('[useRevenueCharts] fetch failed:', message);
		} finally {
			setIsLoading(false);
		}
	}, [year]);

	useEffect(() => {
		fetchData();
		const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [fetchData]);

	return { data, isLoading, error, refetch: fetchData };
}
