import { render, screen } from '@testing-library/react';
import { TransactionList } from '../components/TransactionList';
import { WalletView } from '../components/WalletView';

describe('Payment Monitoring', () => {
	it('renders transactions list', () => {
		render(<TransactionList />);
		expect(screen.getByText('PENDING')).toBeInTheDocument();
	});

	it('renders wallet view', () => {
		render(<WalletView />);
		expect(screen.getByText('Total Balance')).toBeInTheDocument();
		expect(screen.getByText('Lookup Wallet')).toBeInTheDocument();
	});
});
