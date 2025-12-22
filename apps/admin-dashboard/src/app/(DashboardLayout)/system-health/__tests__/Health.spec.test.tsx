import { render, screen } from '@testing-library/react';
import { HealthMetrics } from '../components/HealthMetrics';


describe('System Health', () => {
	it('renders all metrics', () => {
		render(<HealthMetrics />);

		expect(screen.getByText('API Status')).toBeInTheDocument();
		expect(screen.getByText('Operational')).toBeInTheDocument();

		expect(screen.getByText('Active Nodes')).toBeInTheDocument();
		expect(screen.getByText('5/5')).toBeInTheDocument();

		expect(screen.getByText('Database Load')).toBeInTheDocument();
		expect(screen.getByText('12%')).toBeInTheDocument();
	});
});
