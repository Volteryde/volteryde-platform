/**
 * Dashboard metrics summary
 */
export interface DashboardMetrics {
	totalRealRevenue: number;
	totalSystemBalance: number;
	currency: string;
	lastUpdated: string;
}

/**
 * Sales overview data for charts
 */
export interface SalesOverview {
	period: string;
	revenue: number;
	bookings: number;
}

/**
 * Yearly breakdown data
 */
export interface YearlyBreakdown {
	year: number;
	totalRevenue: number;
	growthPercentage: number;
	monthlyData: MonthlyData[];
}

/**
 * Monthly data point
 */
export interface MonthlyData {
	month: string;
	revenue: number;
	expenses: number;
	profit: number;
}

/**
 * Product/Service performance data
 */
export interface ProductPerformance {
	id: string;
	name: string;
	assignee: {
		name: string;
		designation: string;
	};
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	budget: number;
	progress: number;
}

/**
 * System health metrics
 */
export interface SystemHealth {
	service: string;
	status: 'healthy' | 'degraded' | 'down';
	latency: number;
	uptime: number;
	lastCheck: string;
}
