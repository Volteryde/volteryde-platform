import { get } from './base';
import type {
	DashboardMetrics,
	SalesOverview,
	YearlyBreakdown,
	ProductPerformance,
	SystemHealth,
} from '../types';

const BASE_PATH = '/api/dashboard';

/**
 * Get dashboard metrics summary
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
	return get<DashboardMetrics>(`${BASE_PATH}/metrics`);
}

/**
 * Get sales overview data for charts
 */
export async function getSalesOverview(period?: 'week' | 'month' | 'year'): Promise<SalesOverview[]> {
	return get<SalesOverview[]>(`${BASE_PATH}/sales-overview`, { params: { period } });
}

/**
 * Get yearly breakdown data
 */
export async function getYearlyBreakdown(year?: number): Promise<YearlyBreakdown> {
	return get<YearlyBreakdown>(`${BASE_PATH}/yearly-breakdown`, { params: { year } });
}

/**
 * Get product/service performance data
 */
export async function getProductPerformance(): Promise<ProductPerformance[]> {
	return get<ProductPerformance[]>(`${BASE_PATH}/product-performance`);
}

/**
 * Get system health status for all services
 */
export async function getSystemHealth(): Promise<SystemHealth[]> {
	return get<SystemHealth[]>(`${BASE_PATH}/system-health`);
}
