import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { HealthMetrics } from './components/HealthMetrics';

export default function SystemHealthPage() {
	return (
		<PageContainer scrollable={true}>
			<div className="flex flex-1 flex-col space-y-4">
				<Heading
					title="System Health"
					description="Real-time infrastructure monitoring."
				/>
				<Separator />
				<HealthMetrics />
			</div>
		</PageContainer>
	);
}
