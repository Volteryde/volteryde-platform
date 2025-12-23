'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function AnalyticsCharts() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	const chartData = {
		options: {
			chart: {
				id: 'basic-bar',
				toolbar: {
					show: false
				},
				background: 'transparent',
				foreColor: isDark ? '#f3f4f6' : '#374151', // gray-100 vs gray-700
			},
			colors: ['#0CCF0E'], // Volteryde Green
			xaxis: {
				categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
				axisBorder: {
					color: isDark ? '#374151' : '#e5e7eb',
				},
				axisTicks: {
					color: isDark ? '#374151' : '#e5e7eb',
				}
			},
			grid: {
				borderColor: isDark ? '#374151' : '#e5e7eb',
			},
			tooltip: {
				theme: isDark ? 'dark' : 'light',
			},
			theme: {
				mode: isDark ? 'dark' : 'light',
			},
		},
		series: [
			{
				name: 'series-1',
				data: [30, 40, 45, 50, 49, 60, 70, 91],
			},
		],
	};

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
			<Card className="bg-white dark:bg-gray-800 border-none shadow-md">
				<CardHeader>
					<CardTitle className="text-gray-900 dark:text-white">User Growth</CardTitle>
				</CardHeader>
				<CardContent>
					<Chart
						options={chartData.options as any}
						series={chartData.series}
						type="bar"
						width="100%"
						height="350"
					/>
				</CardContent>
			</Card>

			<Card className="bg-white dark:bg-gray-800 border-none shadow-md">
				<CardHeader>
					<CardTitle className="text-gray-900 dark:text-white">Revenue</CardTitle>
				</CardHeader>
				<CardContent>
					<Chart
						options={chartData.options as any}
						series={chartData.series}
						type="line"
						width="100%"
						height="350"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
