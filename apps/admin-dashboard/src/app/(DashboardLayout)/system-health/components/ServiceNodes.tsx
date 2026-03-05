/**
 * ServiceNodes — Live table of all VolteRyde infrastructure nodes.
 *
 * Austin — Displays every container/service with real-time status,
 * latency, port mapping, and health indicators. Grouped by category
 * (core services, databases, messaging, monitoring).
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components/ui/tabs';
import {
	Server,
	Database,
	Radio,
	BarChart3,
	CircleDot,
} from 'lucide-react';
import type { ServiceHealthResult } from '../hooks/useSystemHealth';

interface ServiceNodesProps {
	services: ServiceHealthResult[];
	loading: boolean;
}

// Austin — Category display config
const CATEGORY_CONFIG: Record<string, { label: string; Icon: typeof Server }> = {
	'core-service': { label: 'Core Services', Icon: Server },
	database: { label: 'Databases', Icon: Database },
	messaging: { label: 'Messaging', Icon: Radio },
	monitoring: { label: 'Monitoring', Icon: BarChart3 },
};

// Austin — Status badge mapping
function getStatusBadge(status: string) {
	switch (status) {
		case 'healthy':
			return { variant: 'lightSuccess' as const, text: 'Healthy' };
		case 'degraded':
			return { variant: 'lightWarning' as const, text: 'Degraded' };
		case 'down':
			return { variant: 'lightError' as const, text: 'Down' };
		default:
			return { variant: 'gray' as const, text: 'Unknown' };
	}
}

// Austin — Status dot color for the live indicator
function getStatusDotColor(status: string): string {
	switch (status) {
		case 'healthy': return 'bg-green-500';
		case 'degraded': return 'bg-yellow-500';
		case 'down': return 'bg-red-500';
		default: return 'bg-gray-400';
	}
}

// Austin — Latency color thresholds
function getLatencyColor(latency: number): string {
	if (latency > 3000) return 'text-red-500 font-semibold';
	if (latency > 1000) return 'text-yellow-600';
	if (latency > 500) return 'text-yellow-500';
	return 'text-green-600';
}

// Austin — Service type labels for clarity
function getTypeLabel(type: string): string {
	switch (type) {
		case 'spring-boot': return 'Spring Boot';
		case 'node': return 'Node.js';
		case 'postgres': return 'PostgreSQL';
		case 'redis': return 'Redis';
		case 'kafka': return 'Apache Kafka';
		case 'grafana': return 'Grafana';
		case 'prometheus': return 'Prometheus';
		case 'influxdb': return 'InfluxDB';
		case 'mqtt': return 'MQTT';
		case 'zookeeper': return 'Zookeeper';
		default: return type;
	}
}

function ServiceTable({ services }: { services: ServiceHealthResult[] }) {
	if (services.length === 0) {
		return (
			<div className="py-8 text-center text-sm text-muted-foreground">
				No services in this category.
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<Table className="min-w-[640px]">
				<TableHeader>
					<TableRow>
						<TableHead className="w-8"></TableHead>
						<TableHead>Service</TableHead>
						<TableHead>Type</TableHead>
						<TableHead className="text-center">Port</TableHead>
						<TableHead className="text-center">Status</TableHead>
						<TableHead className="text-right">Latency</TableHead>
						<TableHead className="max-w-[180px]">Details</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{services.map((svc) => {
						const statusBadge = getStatusBadge(svc.status);
						return (
							<TableRow key={svc.name}>
								{/* Austin — Live status dot indicator */}
								<TableCell>
									<div className="flex items-center justify-center">
										<span
											className={`inline-block h-2.5 w-2.5 rounded-full ${getStatusDotColor(svc.status)} ${svc.status === 'healthy' ? 'animate-pulse' : ''}`}
										/>
									</div>
								</TableCell>
								<TableCell>
									<div>
										<div className="font-medium">{svc.displayName}</div>
										<div className="text-xs text-muted-foreground font-mono">
											{svc.name}
										</div>
									</div>
								</TableCell>
								<TableCell>
									<span className="text-xs text-muted-foreground">
										{getTypeLabel(svc.type)}
									</span>
								</TableCell>
								<TableCell className="text-center font-mono text-sm">
									{svc.port}
								</TableCell>
								<TableCell className="text-center">
									<Badge variant={statusBadge.variant}>
										{statusBadge.text}
									</Badge>
								</TableCell>
								<TableCell className={`text-right font-mono text-sm ${getLatencyColor(svc.latency)}`}>
									{svc.latency}ms
								</TableCell>
								<TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
									{svc.details || '—'}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="space-y-3 p-4">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="flex items-center gap-4">
					<Skeleton className="h-3 w-3 rounded-full" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-5 w-16 rounded-full" />
					<Skeleton className="h-4 w-14 ml-auto" />
				</div>
			))}
		</div>
	);
}

export function ServiceNodes({ services, loading }: ServiceNodesProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CircleDot className="h-5 w-5" />
						System Nodes
					</CardTitle>
				</CardHeader>
				<CardContent>
					<LoadingSkeleton />
				</CardContent>
			</Card>
		);
	}

	// Austin — Group services by category
	const categories = Object.entries(CATEGORY_CONFIG);
	const grouped = categories.reduce(
		(acc, [key]) => {
			acc[key] = services.filter((s) => s.category === key);
			return acc;
		},
		{} as Record<string, ServiceHealthResult[]>,
	);

	// Austin — Count for tab badges
	const getTabCount = (category: string) => {
		const items = grouped[category] || [];
		const down = items.filter((s) => s.status === 'down').length;
		const degraded = items.filter((s) => s.status === 'degraded').length;
		return { total: items.length, down, degraded };
	};

	return (
		<Card className="min-w-0 overflow-hidden">
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<CardTitle className="flex items-center gap-2">
						<CircleDot className="h-5 w-5" />
						System Nodes
					</CardTitle>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<span className="inline-block h-2 w-2 rounded-full bg-green-500" />
							Healthy
						</span>
						<span className="flex items-center gap-1">
							<span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
							Degraded
						</span>
						<span className="flex items-center gap-1">
							<span className="inline-block h-2 w-2 rounded-full bg-red-500" />
							Down
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="all">
					{/* Scrollable tab bar so it never wraps or overflows the card */}
					<div className="overflow-x-auto pb-1">
						<TabsList className="mb-4 w-max">
							<TabsTrigger value="all">
								All ({services.length})
							</TabsTrigger>
							{categories.map(([key, config]) => {
								const count = getTabCount(key);
								if (count.total === 0) return null;
								return (
									<TabsTrigger key={key} value={key}>
										<config.Icon className="mr-1 h-3.5 w-3.5" />
										{config.label}
										{count.down > 0 && (
											<Badge variant="lightError" className="ml-1.5 text-[9px] px-1.5 py-0">
												{count.down}
											</Badge>
										)}
									</TabsTrigger>
								);
							})}
						</TabsList>
					</div>

					<TabsContent value="all">
						<ServiceTable services={services} />
					</TabsContent>

					{categories.map(([key]) => (
						<TabsContent key={key} value={key}>
							<ServiceTable services={grouped[key] || []} />
						</TabsContent>
					))}
				</Tabs>
			</CardContent>
		</Card>
	);
}
