import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';


// Mock ReactApexCharts because it relies on window/DOM APIs not fully present in jsdom
jest.mock('react-apexcharts', () => {
	return {
		__esModule: true,
		default: () => <div data-testid="apexchart" />,
	};
});

describe('Reports Module', () => {
	it('renders analytics charts', async () => {
		// We need to await dynamic import resolution if necessary, or just render.
		// Since we mocked chart, strictly it renders immediate or next tick?
		// Dynamic import often means async.

		render(<AnalyticsCharts />);

		// Check for card titles
		expect(screen.getByText('User Growth')).toBeInTheDocument();
		expect(screen.getByText('Revenue')).toBeInTheDocument();
	});
});
