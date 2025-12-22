import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { AnalyticsCharts } from './components/AnalyticsCharts';

export default function ReportsPage() {
	return (
		<PageContainer scrollable={true}>
			<div className="flex flex-1 flex-col space-y-4">
				<Heading
					title="Reports & Analytics"
					description="Detailed business insights and performance metrics."
				/>
				<Separator />
				<AnalyticsCharts />
			</div>
		</PageContainer>
	);
}
