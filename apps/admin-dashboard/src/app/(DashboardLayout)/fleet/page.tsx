'use client';
import PageContainer from '@/components/container/PageContainer';
import DashboardCard from '@/app/components/shared/DashboardCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FleetManagement = () => {
	// Mock Data from DDD Examples
	const vehicles = [
		{ id: 'bus-123', vin: 'V-8932-GH', status: 'Maintenance', battery: '65%', location: 'Depot', lastService: '2025-10-15' },
		{ id: 'bus-456', vin: 'V-2211-ACC', status: 'Active', battery: '20%', location: 'Route 4', lastService: '2025-11-01' },
		{ id: 'bus-789', vin: 'V-5543-TM', status: 'Active', battery: '82%', location: 'Route 1', lastService: '2025-11-02' },
	];

	const maintenanceSchedule = [
		{ id: 'm-001', vehicleId: 'bus-123', type: 'Battery Replacement', date: '2025-11-05', status: 'Scheduled', priority: 'High', cost: '5000 GHS' },
		{ id: 'm-002', vehicleId: 'bus-789', type: 'Tire Rotation', date: '2025-11-12', status: 'Pending', priority: 'Medium', cost: '800 GHS' },
	];

	return (
		<PageContainer title="Fleet Management" description="Manage vehicle roster and maintenance schedules">
			<DashboardCard title="Fleet Operations">
				<Tabs defaultValue="roster" className="w-full">
					<TabsList className="mb-4">
						<TabsTrigger value="roster">Vehicle Roster</TabsTrigger>
						<TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
					</TabsList>

					<TabsContent value="roster">
						<Card>
							<CardHeader>
								<CardTitle>Active Fleet Roster</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Bus ID</TableHead>
											<TableHead>VIN</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Battery</TableHead>
											<TableHead>Location</TableHead>
											<TableHead>Last Service</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{vehicles.map((bus) => (
											<TableRow key={bus.id}>
												<TableCell className="font-medium">{bus.id}</TableCell>
												<TableCell>{bus.vin}</TableCell>
												<TableCell>
													<Badge variant={bus.status === 'Active' ? 'default' : 'destructive'}>
														{bus.status}
													</Badge>
												</TableCell>
												<TableCell>
													<span className={parseInt(bus.battery) < 30 ? 'text-red-500 font-bold' : 'text-green-600'}>
														{bus.battery}
													</span>
												</TableCell>
												<TableCell>{bus.location}</TableCell>
												<TableCell>{bus.lastService}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="maintenance">
						<Card>
							<CardHeader>
								<CardTitle>Upcoming Maintenance</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Job ID</TableHead>
											<TableHead>Vehicle</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Priority</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Est. Cost</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{maintenanceSchedule.map((job) => (
											<TableRow key={job.id}>
												<TableCell>{job.id}</TableCell>
												<TableCell className="font-medium">{job.vehicleId}</TableCell>
												<TableCell>{job.type}</TableCell>
												<TableCell>{job.date}</TableCell>
												<TableCell>
													<Badge variant="outline" className={job.priority === 'High' ? 'border-red-500 text-red-500' : 'border-amber-500 text-amber-500'}>
														{job.priority}
													</Badge>
												</TableCell>
												<TableCell>{job.status}</TableCell>
												<TableCell>{job.cost}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</DashboardCard>
		</PageContainer>
	);
};

export default FleetManagement;
