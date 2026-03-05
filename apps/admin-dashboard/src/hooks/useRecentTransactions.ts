/**
 * Austin — Shared hook for fetching recent transactions.
 *
 * Used by:
 *   - RecentTransaction.tsx (dashboard widget, limit=6, no pagination)
 *   - TransactionList.tsx   (/payments page, limit=10, with pagination)
 *
 * Auto-refreshes every 2 minutes for the dashboard widget.
 */

import { useState, useEffect, useCallback } from 'react';

export interface Transaction {
	id: string;
	source: 'payment' | 'wallet' | 'booking';
	userName: string;
	type: string;
	description: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: string;
}

export interface Pagination {
	page: number;
	limit: number;
	totalCount: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface UseRecentTransactionsOptions {
	limit?: number;
	page?: number;
	status?: string | null;
	source?: string | null; // Austin — filter by source: 'payment' | 'wallet' | 'booking'
	autoRefreshMs?: number | null; // null = no auto-refresh
}

interface UseRecentTransactionsReturn {
	transactions: Transaction[];
	pagination: Pagination | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
	setPage: (page: number) => void;
}

export function useRecentTransactions(
	options: UseRecentTransactionsOptions = {},
): UseRecentTransactionsReturn {
	const {
		limit = 10,
		page: initialPage = 1,
		status = null,
		source = null,
		autoRefreshMs = null,
	} = options;

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(initialPage);

	const fetchTransactions = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				limit: String(limit),
				page: String(page),
			});
			if (status) params.set('status', status);
			if (source) params.set('source', source);

			const res = await fetch(`/api/metrics/recent-transactions?${params}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const data = await res.json();
			setTransactions(data.transactions || []);
			setPagination(data.pagination || null);
		} catch (err) {
			console.error('[useRecentTransactions] Fetch error:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
		} finally {
			setLoading(false);
		}
	}, [limit, page, status, source]);

	useEffect(() => {
		fetchTransactions();
	}, [fetchTransactions]);

	// Austin — Auto-refresh for dashboard widget
	useEffect(() => {
		if (!autoRefreshMs) return;
		const interval = setInterval(fetchTransactions, autoRefreshMs);
		return () => clearInterval(interval);
	}, [autoRefreshMs, fetchTransactions]);

	return {
		transactions,
		pagination,
		loading,
		error,
		refetch: fetchTransactions,
		setPage,
	};
}
