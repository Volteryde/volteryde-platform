import { render, screen } from '@testing-library/react';
import { UserTable } from '../components/UserTable';

describe('UserTable', () => {
	it('renders a table with user data', () => {
		render(<UserTable />);

		// Check table headers
		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Email')).toBeInTheDocument();
		expect(screen.getByText('Role')).toBeInTheDocument();
		expect(screen.getByText('Status')).toBeInTheDocument();

		// Check user data
		expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
		expect(screen.getByText('alice@admin.com')).toBeInTheDocument();
		expect(screen.getAllByText('ADMIN')[0]).toBeInTheDocument();

		// Check for ACTIVE status (appears twice)
		const activeStatuses = screen.getAllByText('ACTIVE');
		expect(activeStatuses).toHaveLength(7);
	});
});
