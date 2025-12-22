'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Server, Database, Cpu } from 'lucide-react';

const metrics = [
	{
		title: 'API Status',
		value: 'Operational',
		icon: Activity,
		color: 'text-green-500',
	},
	{
		title: 'Active Nodes',
		value: '5/5',
		icon: Server,
		color: 'text-blue-500',
	},
	{
		title: 'Database Load',
		value: '12%',
		icon: Database,
		color: 'text-yellow-500',
	},
	{
		title: 'CPU Usage',
		value: '34%',
		icon: Cpu,
		color: 'text-purple-500',
	},
];

export function HealthMetrics() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{metrics.map((metric) => (
				<Card key={metric.title}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{metric.title}
						</CardTitle>
						<metric.icon className={`h-4 w-4 ${metric.color}`} />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metric.value}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
