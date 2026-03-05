/**
 * HealthMetrics — Live infrastructure summary cards.
 *
 * Austin — This component displays real-time aggregate metrics pulled
 * from the /api/system/health endpoint. It shows overall system status,
 * active node counts, database connection load, and average service latency.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Activity,
	Server,
	Database,
	Gauge,
	CheckCircle2,
	AlertTriangle,
	XCircle,
} from 'lucide-react';
import type { SystemHealthData } from '../hooks/useSystemHealth';

interface HealthMetricsProps {
	data: SystemHealthData | null;
	loading: boolean;
}

// Austin — Map overall status to visual indicators
function getStatusConfig(status: string) {
	switch (status) {
		case 'healthy':
			return { label: 'All Systems Operational', color: 'text-green-500', badge: 'lightSuccess' as const, Icon: CheckCircle2 };
		case 'degraded':
			return { label: 'Partial Degradation', color: 'text-yellow-500', badge: 'lightWarning' as const, Icon: AlertTriangle };
		case 'critical':
			return { label: 'Critical Issues', color: 'text-red-500', badge: 'lightError' as const, Icon: XCircle };
		default:
			return { label: 'Unknown', color: 'text-gray-500', badge: 'gray' as const, Icon: Activity };
	}
}

export function HealthMetrics({ data, loading }: HealthMetricsProps) {
	if (loading || !data) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-20" />
							<Skeleton className="mt-2 h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const { summary, databaseStats } = data;
	const statusConfig = getStatusConfig(summary.overallStatus);

	// Austin — Calculate average latency across all healthy/degraded services
	const respondingServices = data.services.filter((s) => s.status !== 'down');
	const avgLatency =
		respondingServices.length > 0
			? Math.round(
					respondingServices.reduce((sum, s) => sum + s.latency, 0) /
						respondingServices.length,
				)
			: 0;

	// Austin — DB connection utilization percentage
	const dbUtilization =
		databaseStats
			? Math.round(
					(databaseStats.activeConnections / databaseStats.maxConnections) * 100,
				)
			: 0;

	const metrics = [
		{
			title: 'System Status',
			value: statusConfig.label,
			subtext: `Last check: ${new Date(data.timestamp).toLocaleTimeString()}`,
			Icon: statusConfig.Icon,
			color: statusConfig.color,
			badgeVariant: statusConfig.badge,
			badgeText: summary.overallStatus.toUpperCase(),
		},
		{
			title: 'Active Nodes',
			value: `${summary.healthyNodes}/${summary.totalNodes}`,
			subtext: summary.downNodes > 0
				? `${summary.downNodes} down · ${summary.degradedNodes} degraded`
				: summary.degradedNodes > 0
					? `${summary.degradedNodes} degraded`
					: 'All nodes responding',
			Icon: Server,
			color:
				summary.downNodes > 0
					? 'text-red-500'
					: summary.degradedNodes > 0
						? 'text-yellow-500'
						: 'text-green-500',
		},
		{
			title: 'Database Load',
			value: databaseStats
				? `${databaseStats.activeConnections}/${databaseStats.maxConnections}`
				: 'N/A',
			subtext: databaseStats
				? `${dbUtilization}% · ${databaseStats.totalSize} · ${databaseStats.databaseCount} DBs`
				: 'Unable to query database',
			Icon: Database,
			color:
				dbUtilization > 80
					? 'text-red-500'
					: dbUtilization > 50
						? 'text-yellow-500'
						: 'text-blue-500',
		},
		{
			title: 'Avg Latency',
			value: `${avgLatency}ms`,
			subtext: `Across ${respondingServices.length} responding services`,
			Icon: Gauge,
			color:
				avgLatency > 3000
					? 'text-red-500'
					: avgLatency > 1000
						? 'text-yellow-500'
						: 'text-green-500',
		},
	];

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{metrics.map((metric) => (
				<Card key={metric.title} className="min-w-0">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{metric.title}
						</CardTitle>
						<metric.Icon className={`h-4 w-4 shrink-0 ${metric.color}`} />
					</CardHeader>
					<CardContent>
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<div className="truncate text-xl font-bold">{metric.value}</div>
							{metric.badgeVariant && (
								<Badge variant={metric.badgeVariant} className="shrink-0 text-[10px]">
									{metric.badgeText}
								</Badge>
							)}
						</div>
						<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
							{metric.subtext}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
