'use client';
import TicketsApp from '@/app/components/apps/tickets';
import PageContainer from '@/components/container/PageContainer';
import BreadcrumbComp from '@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp';

const Tickets = () => {
	return (
		<PageContainer title="Tickets" description="Manage support tickets">
			<BreadcrumbComp title="Tickets" />
			<TicketsApp />
		</PageContainer>
	);
};

export default Tickets;
