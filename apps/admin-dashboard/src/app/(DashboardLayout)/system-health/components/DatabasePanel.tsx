/**
 * DatabasePanel — Detailed PostgreSQL database statistics panel.
 *
 * Austin — Shows real-time database connection utilization, total size,
 * database count, and server uptime. This data comes from actual
 * pg_stat_activity and pg_database queries — not estimates.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, HardDrive, Clock, Layers } from 'lucide-react';
import type { DatabaseStats } from '../hooks/useSystemHealth';

interface DatabasePanelProps {
	stats: DatabaseStats | null;
	loading: boolean;
}

export function DatabasePanel({ stats, loading }: DatabasePanelProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Database className="h-5 w-5" />
						PostgreSQL Overview
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (!stats) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Database className="h-5 w-5 text-red-500" />
						PostgreSQL Overview
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Unable to connect to PostgreSQL. Database may be offline.
					</p>
				</CardContent>
			</Card>
		);
	}

	const utilization = Math.round(
		(stats.activeConnections / stats.maxConnections) * 100,
	);

	// Austin — Color thresholds for connection utilization
	const utilizationColor =
		utilization > 80 ? 'text-red-500' : utilization > 50 ? 'text-yellow-500' : 'text-green-500';

	const progressVariant =
		utilization > 80 ? 'error' as const : utilization > 50 ? 'warning' as const : 'default' as const;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Database className="h-5 w-5 text-blue-500" />
					PostgreSQL Overview
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5">
				{/* Austin — Connection utilization with progress bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Connection Pool</span>
						<span className={`font-mono font-semibold ${utilizationColor}`}>
							{stats.activeConnections} / {stats.maxConnections}
						</span>
					</div>
					<Progress value={utilization} variant={progressVariant} />
					<p className="text-xs text-muted-foreground">
						{utilization}% utilization
					</p>
				</div>

				{/* Austin — Quick stats row */}
				<div className="grid grid-cols-3 gap-2">
					<div className="flex flex-col items-center gap-1 rounded-lg border p-2">
						<Layers className="h-4 w-4 text-muted-foreground" />
						<span className="text-lg font-bold leading-none">{stats.databaseCount}</span>
						<span className="text-center text-[10px] text-muted-foreground">Databases</span>
					</div>
					<div className="flex flex-col items-center gap-1 rounded-lg border p-2">
						<HardDrive className="h-4 w-4 text-muted-foreground" />
						<span className="truncate text-lg font-bold leading-none">{stats.totalSize}</span>
						<span className="text-center text-[10px] text-muted-foreground">Total Size</span>
					</div>
					<div className="flex flex-col items-center gap-1 rounded-lg border p-2">
						<Clock className="h-4 w-4 text-muted-foreground" />
						<span className="truncate text-lg font-bold leading-none">{stats.uptime}</span>
						<span className="text-center text-[10px] text-muted-foreground">Uptime</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
