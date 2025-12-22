'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const chartData = {
	options: {
		chart: {
			id: 'basic-bar',
			toolbar: {
				show: false
			}
		},
		colors: ['#0CCF0E'], // Volteryde Green
		xaxis: {
			categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
		},
	},
	series: [
		{
			name: 'series-1',
			data: [30, 40, 45, 50, 49, 60, 70, 91],
		},
	],
};

export function AnalyticsCharts() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>User Growth</CardTitle>
				</CardHeader>
				<CardContent>
					<Chart
						options={chartData.options}
						series={chartData.series}
						type="bar"
						width="100%"
						height="350"
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Revenue</CardTitle>
				</CardHeader>
				<CardContent>
					<Chart
						options={chartData.options}
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
