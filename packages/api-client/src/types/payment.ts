/**
 * Wallet balance response
 */
export interface WalletBalance {
	balance: number;
	currency: string;
	lastUpdated: string;
}

/**
 * Transaction types
 */
export enum TransactionType {
	CREDIT = 'CREDIT',
	DEBIT = 'DEBIT',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
	PENDING = 'PENDING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	REVERSED = 'REVERSED',
}

/**
 * Transaction record
 */
export interface Transaction {
	id: string;
	userId: string;
	type: TransactionType;
	amount: number;
	currency: string;
	status: TransactionStatus;
	description: string;
	reference: string;
	createdAt: string;
}

/**
 * Payment initialization request
 */
export interface InitializePaymentRequest {
	amount: number;
	email: string;
	currency?: string;
	callbackUrl?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Payment initialization response
 */
export interface InitializePaymentResponse {
	authorizationUrl: string;
	accessCode: string;
	reference: string;
}

/**
 * Recent transaction for dashboard display
 */
export interface RecentTransaction {
	id: string;
	time: string;
	description: string;
	amount?: number;
	type: 'payment' | 'sale' | 'refund';
	status: TransactionStatus;
}
