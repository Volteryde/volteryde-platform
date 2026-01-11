import { get, post } from './base';
import type {
	WalletBalance,
	Transaction,
	RecentTransaction,
	InitializePaymentRequest,
	InitializePaymentResponse,
} from '../types';

const WALLET_PATH = '/api/wallets';
const PAYMENT_PATH = '/api/payments';

/**
 * Get wallet balance for a user
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
	return get<WalletBalance>(`${WALLET_PATH}/${userId}/balance`);
}

/**
 * Get transaction history for a wallet
 */
export async function getTransactions(
	userId: string,
	params?: { page?: number; limit?: number }
): Promise<Transaction[]> {
	return get<Transaction[]>(`${WALLET_PATH}/${userId}/transactions`, { params });
}

/**
 * Get recent transactions for dashboard display
 */
export async function getRecentTransactions(limit?: number): Promise<RecentTransaction[]> {
	return get<RecentTransaction[]>(`${PAYMENT_PATH}/recent`, { params: { limit } });
}

/**
 * Initialize a new payment
 */
export async function initializePayment(
	data: InitializePaymentRequest
): Promise<InitializePaymentResponse> {
	return post<InitializePaymentResponse, InitializePaymentRequest>(
		`${PAYMENT_PATH}/initialize`,
		data
	);
}
