'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, BookOpen, BadgeDollarSign } from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface RevenueChartData {
	availableYears: number[];
	revenueChart: { year: number; categories: string[]; earnings: number[]; expenses: number[] };
	yearlyBreakup: { years: string[]; values: number[]; total: number; yoyChangePercent: number };
	monthlyEarnings: { labels: string[]; data: number[]; currentMonth: number; momChangePercent: number };
	currency: string;
}

interface FinanceMetrics {
	totalRealRevenue: { amount: number; transactionCount: number };
	totalSystemBalance: { amount: number; realBalance: number; promoBalance: number; walletCount: number };
	totalBookingRevenue: { amount: number; bookingCount: number };
	currency: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, currency = 'GHS') {
	return new Intl.NumberFormat('en-GH', {
		style: 'currency', currency,
		minimumFractionDigits: 2, maximumFractionDigits: 2,
	}).format(n);
}

function TrendBadge({ value }: { value: number }) {
	const up = value >= 0;
	return (
		<span className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
			{up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
			{Math.abs(value).toFixed(1)}%
		</span>
	);
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsCharts() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	const [year, setYear] = useState<number>(new Date().getFullYear());
	const [chartData, setChartData] = useState<RevenueChartData | null>(null);
	const [finance, setFinance] = useState<FinanceMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Finance summary — independent of year
	useEffect(() => {
		fetch('/api/metrics/finance')
			.then(r => r.ok ? r.json() : Promise.reject(r))
			.then(setFinance)
			.catch(() => {/* non-critical */});
	}, []);

	// Chart data — refetch when year changes
	useEffect(() => {
		setLoading(true);
		setError(null);
		fetch(`/api/metrics/revenue-charts?year=${year}`)
			.then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
			.then((data: RevenueChartData) => {
				setChartData(data);
				if (data.availableYears.length && !data.availableYears.includes(year)) {
					setYear(data.availableYears[0]);
				}
			})
			.catch(e => setError(e.message ?? 'Failed to load chart data'))
			.finally(() => setLoading(false));
	}, [year]);

	// ── Chart theme ───────────────────────────────────────────────────────────
	const textColor = isDark ? '#d1d5db' : '#374151';
	const gridColor = isDark ? '#374151' : '#e5e7eb';
	const base = {
		chart: { toolbar: { show: false }, background: 'transparent', foreColor: textColor, fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' },
		grid: { borderColor: gridColor },
		tooltip: { theme: isDark ? 'dark' : 'light', style: { fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' } },
		theme: { mode: isDark ? ('dark' as const) : ('light' as const) },
	};

	// Bar — monthly revenue
	const barOptions = {
		...base,
		chart: { ...base.chart, id: 'revenue-bar', type: 'bar' as const },
		colors: ['#0CCF0E', '#ef4444'],
		xaxis: {
			categories: chartData?.revenueChart.categories ?? [],
			axisBorder: { color: gridColor },
			axisTicks: { color: gridColor },
		},
		yaxis: { labels: { formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) } },
		dataLabels: { enabled: false },
		plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
		legend: { position: 'top' as const },
	};
	const barSeries = chartData
		? [{ name: 'Earnings', data: chartData.revenueChart.earnings }, { name: 'Expenses', data: chartData.revenueChart.expenses }]
		: [];

	// Donut — yearly breakup
	const donutOptions = {
		...base,
		chart: { ...base.chart, id: 'yearly-donut', type: 'donut' as const },
		colors: ['#0CCF0E', '#3b82f6', '#f59e0b'],
		labels: chartData?.yearlyBreakup.years ?? [],
		dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%` },
		legend: { position: 'bottom' as const },
		plotOptions: { pie: { donut: { size: '60%' } } },
	};
	const donutSeries = chartData?.yearlyBreakup.values ?? [];

	// Area — monthly trend
	const areaOptions = {
		...base,
		chart: { ...base.chart, id: 'monthly-area', type: 'area' as const },
		colors: ['#0CCF0E'],
		fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 } },
		stroke: { curve: 'smooth' as const, width: 2 },
		xaxis: { categories: chartData?.monthlyEarnings.labels ?? [], axisBorder: { color: gridColor }, axisTicks: { color: gridColor } },
		yaxis: { labels: { formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) } },
		dataLabels: { enabled: false },
	};
	const areaSeries = chartData ? [{ name: 'Earnings', data: chartData.monthlyEarnings.data }] : [];

	const currency = chartData?.currency ?? finance?.currency ?? 'GHS';

	return (
		<div className="space-y-6">

			{/* ── Summary cards ── */}
			<div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
				<StatCard
					icon={<BadgeDollarSign className="h-4 w-4 text-green-600" />}
					label="Total Revenue"
					value={finance ? fmt(finance.totalRealRevenue.amount, currency) : '—'}
					sub={finance ? `${finance.totalRealRevenue.transactionCount} transactions` : undefined}
					loading={!finance}
				/>
				<StatCard
					icon={<Wallet className="h-4 w-4 text-blue-500" />}
					label="System Wallet Balance"
					value={finance ? fmt(finance.totalSystemBalance.amount, currency) : '—'}
					sub={finance ? `${finance.totalSystemBalance.walletCount} wallets` : undefined}
					loading={!finance}
				/>
				<StatCard
					icon={<BookOpen className="h-4 w-4 text-amber-500" />}
					label="Booking Revenue"
					value={finance ? fmt(finance.totalBookingRevenue.amount, currency) : '—'}
					sub={finance ? `${finance.totalBookingRevenue.bookingCount} rides` : undefined}
					loading={!finance}
				/>
			</div>

			{error && (
				<p className="text-sm text-red-500 border border-red-200 rounded-sm px-4 py-3 bg-red-50 dark:bg-red-900/10">
					Could not load chart data: {error}
				</p>
			)}

			{/* ── Monthly revenue bar chart ── */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<div>
						<CardTitle className="text-base">Monthly Revenue</CardTitle>
						{chartData && (
							<div className="flex items-center gap-2 mt-1">
								<span className="text-xs text-muted-foreground">YoY</span>
								<TrendBadge value={chartData.yearlyBreakup.yoyChangePercent} />
							</div>
						)}
					</div>
					<Select value={String(year)} onValueChange={v => setYear(Number(v))}>
						<SelectTrigger className="w-28 h-8 text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(chartData?.availableYears ?? [new Date().getFullYear()]).map(y => (
								<SelectItem key={y} value={String(y)}>{y}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardHeader>
				<CardContent>
					{loading
						? <Skeleton className="h-[320px] w-full rounded-sm" />
						: <Chart options={barOptions as any} series={barSeries} type="bar" width="100%" height={320} />
					}
				</CardContent>
			</Card>

			{/* ── Yearly donut + monthly trend ── */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Revenue by Year</CardTitle>
						{chartData && (
							<p className="text-xs text-muted-foreground">
								Total: {fmt(chartData.yearlyBreakup.total, currency)}
							</p>
						)}
					</CardHeader>
					<CardContent>
						{loading
							? <Skeleton className="h-[280px] w-full rounded-sm" />
							: donutSeries.every(v => v === 0)
								? <EmptyState label="No revenue data yet" />
								: <Chart options={donutOptions as any} series={donutSeries} type="donut" width="100%" height={280} />
						}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Earnings Trend (Last 7 Months)</CardTitle>
						{chartData && (
							<div className="flex items-center gap-2 mt-1">
								<span className="text-xs text-muted-foreground">
									This month: {fmt(chartData.monthlyEarnings.currentMonth, currency)}
								</span>
								<TrendBadge value={chartData.monthlyEarnings.momChangePercent} />
							</div>
						)}
					</CardHeader>
					<CardContent>
						{loading
							? <Skeleton className="h-[280px] w-full rounded-sm" />
							: <Chart options={areaOptions as any} series={areaSeries} type="area" width="100%" height={280} />
						}
					</CardContent>
				</Card>
			</div>

		</div>
	);
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, loading }: {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
	loading?: boolean;
}) {
	return (
		<Card>
			<CardContent className="pt-5">
				<div className="flex items-center gap-2 mb-3">
					<div className="p-1.5 rounded-sm bg-muted">{icon}</div>
					<span className="text-sm text-muted-foreground">{label}</span>
				</div>
				{loading ? (
					<><Skeleton className="h-7 w-32 mb-1" /><Skeleton className="h-4 w-20" /></>
				) : (
					<>
						<p className="text-xl font-semibold font-mono">{value}</p>
						{sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
					</>
				)}
			</CardContent>
		</Card>
	);
}

function EmptyState({ label }: { label: string }) {
	return (
		<div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-sm">
			{label}
		</div>
	);
}
