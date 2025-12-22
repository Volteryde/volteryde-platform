'use client';
import PageContainer from '@/components/container/PageContainer';
import DashboardCard from '@/app/components/shared/DashboardCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BookingManagement = () => {
	// Mock Data from DDD Examples
	const bookings = [
		{ id: 'bk-1001', user: 'Kwame Mensah', route: 'Accra -> Kumasi', time: '10:00 AM', seat: '12A', status: 'Confirmed', amount: '120 GHS' },
		{ id: 'bk-1002', user: 'Ama Serwaa', route: 'Tema -> Spintex', time: '02:30 PM', seat: '04B', status: 'Boarded', amount: '45 GHS' },
		{ id: 'bk-1003', user: 'John Doe', route: 'Madina -> Circle', time: '08:00 AM', seat: '01A', status: 'Completed', amount: '25 GHS' },
		{ id: 'bk-1004', user: 'Abena Osei', route: 'Kasoa -> Lapaz', time: '05:45 PM', seat: '15C', status: 'Cancelled', amount: '0 GHS' },
	];

	return (
		<PageContainer title="Booking Management" description="Monitor active rides and passenger manifests">
			<DashboardCard title="Rides & Bookings">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Bookings (Today)</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">1,234</div>
							<p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Active Rides</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">45</div>
							<p className="text-xs text-muted-foreground">Currently in transit</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Recent Bookings</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Booking ID</TableHead>
									<TableHead>Passenger</TableHead>
									<TableHead>Route</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Seat</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{bookings.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell className="font-medium">{booking.id}</TableCell>
										<TableCell>{booking.user}</TableCell>
										<TableCell>{booking.route}</TableCell>
										<TableCell>{booking.time}</TableCell>
										<TableCell>{booking.seat}</TableCell>
										<TableCell>
											<Badge variant={
												booking.status === 'Confirmed' ? 'default' :
													booking.status === 'Boarded' ? 'secondary' :
														booking.status === 'Completed' ? 'outline' : 'destructive'
											}>
												{booking.status}
											</Badge>
										</TableCell>
										<TableCell>{booking.amount}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</DashboardCard>
		</PageContainer>
	);
};

export default BookingManagement;
