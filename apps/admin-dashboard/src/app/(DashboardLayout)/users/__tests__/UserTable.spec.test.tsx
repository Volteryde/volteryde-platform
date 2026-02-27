import { render, screen, waitFor } from '@testing-library/react';
import { UserTable } from '../components/UserTable';

// Mock the api-client module
jest.mock('@volteryde/api-client', () => ({
	usersApi: {
		getUsers: jest.fn().mockResolvedValue([
			{
				id: 'u1',
				userId: 'USR-001',
				firstName: 'Alice',
				lastName: 'Johnson',
				email: 'alice@admin.com',
				role: 'ADMIN',
				status: 'ACTIVE',
			},
			{
				id: 'u2',
				userId: 'USR-002',
				firstName: 'Bob',
				lastName: 'Smith',
				email: 'bob@driver.com',
				role: 'DRIVER',
				status: 'ACTIVE',
			},
		]),
	},
	configureApiClient: jest.fn(),
}));

describe('UserTable', () => {
	it('renders table headers during loading', () => {
		render(<UserTable />);

		// Check table headers are rendered immediately
		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Email')).toBeInTheDocument();
		expect(screen.getByText('Role')).toBeInTheDocument();
		expect(screen.getByText('Status')).toBeInTheDocument();
	});

	it('renders user data after loading', async () => {
		render(<UserTable />);

		// Wait for API data to load
		await waitFor(() => {
			expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
		});

		// Check user data is displayed
		expect(screen.getByText('alice@admin.com')).toBeInTheDocument();
		expect(screen.getByText('Bob Smith')).toBeInTheDocument();
		expect(screen.getByText('bob@driver.com')).toBeInTheDocument();

		// Check roles and status
		expect(screen.getByText('ADMIN')).toBeInTheDocument();
		expect(screen.getByText('DRIVER')).toBeInTheDocument();
		expect(screen.getAllByText('ACTIVE')).toHaveLength(2);
	});
});
