/**
 * System Health Page — Live infrastructure monitoring dashboard.
 *
 * Austin — This page shows REAL data from running Docker containers,
 * databases, and services. No dummy data. The useSystemHealth hook
 * polls /api/system/health every 30 seconds for fresh metrics.
 */

'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { HealthMetrics } from './components/HealthMetrics';
import { ServiceNodes } from './components/ServiceNodes';
import { DatabasePanel } from './components/DatabasePanel';
import { useSystemHealth } from './hooks/useSystemHealth';

export default function SystemHealthPage() {
	const { data, loading, error, refresh, lastUpdated } = useSystemHealth(30_000);

	return (
		<PageContainer scrollable={true}>
			<div className="flex flex-1 flex-col space-y-4">
				{/* ── Header ── */}
				<div className="flex flex-wrap items-start justify-between gap-3">
					<Heading
						title="System Health"
						description="Real-time infrastructure monitoring."
					/>
					<div className="flex shrink-0 items-center gap-3">
						{lastUpdated && (
							<span className="hidden text-xs text-muted-foreground sm:inline">
								Updated {lastUpdated.toLocaleTimeString()}
							</span>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={refresh}
							disabled={loading}
						>
							<RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
							Refresh
						</Button>
					</div>
				</div>
				<Separator />

				{/* Austin — Error banner if health check fails entirely */}
				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
						<strong>Health check error:</strong> {error}
					</div>
				)}

				{/* Austin — Top-level metric summary cards */}
				<HealthMetrics data={data} loading={loading} />

				{/* Austin — Database panel + Service nodes table */}
				<div className="grid gap-4 lg:grid-cols-3">
					<div className="lg:col-span-1">
						<DatabasePanel
							stats={data?.databaseStats ?? null}
							loading={loading}
						/>
					</div>
					<div className="min-w-0 lg:col-span-2">
						<ServiceNodes
							services={data?.services ?? []}
							loading={loading}
						/>
					</div>
				</div>
			</div>
		</PageContainer>
	);
}
