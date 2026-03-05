/**
 * Austin — Hooks for wallet data on the /payments page.
 *
 * useWallets()       — fetches wallet list with balances + aggregate stats
 * useWalletLookup()  — searches a specific wallet by user_id/email and
 *                       returns wallet balance + full transaction history
 */

import { useState, useEffect, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export interface WalletEntry {
	id: string;
	customerId: string;
	userName: string;
	email: string;
	userId: string;
	role: string;
	userStatus: string;
	realBalance: number;
	promoBalance: number;
	totalBalance: number;
	createdAt: string;
	updatedAt: string;
}

export interface WalletStats {
	walletCount: number;
	totalRealBalance: number;
	totalPromoBalance: number;
	totalPlatformBalance: number;
}

export interface WalletPagination {
	page: number;
	limit: number;
	totalCount: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface WalletTransaction {
	id: string;
	source: 'wallet' | 'payment';
	type: string;
	balanceType: string | null;
	description: string;
	amount: number;
	currency: string;
	status: string;
	reference: string | null;
	createdAt: string;
}

export interface WalletUserInfo {
	id: string;
	userId: string;
	name: string;
	email: string;
	phone: string;
	role: string;
	status: string;
}

export interface WalletDetail {
	id: string;
	customerId: string;
	realBalance: number;
	promoBalance: number;
	totalBalance: number;
	createdAt: string;
	updatedAt: string;
}

// ────────────────────────────────────────────────────────────────────
// useWallets — list all wallets with stats
// ────────────────────────────────────────────────────────────────────

interface UseWalletsOptions {
	limit?: number;
	page?: number;
	search?: string;
}

interface UseWalletsReturn {
	wallets: WalletEntry[];
	stats: WalletStats | null;
	pagination: WalletPagination | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
	setPage: (page: number) => void;
	setSearch: (search: string) => void;
}

export function useWallets(options: UseWalletsOptions = {}): UseWalletsReturn {
	const { limit = 20, page: initialPage = 1, search: initialSearch = '' } = options;

	const [wallets, setWallets] = useState<WalletEntry[]>([]);
	const [stats, setStats] = useState<WalletStats | null>(null);
	const [pagination, setPagination] = useState<WalletPagination | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(initialPage);
	const [search, setSearch] = useState(initialSearch);

	const fetchWallets = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				limit: String(limit),
				page: String(page),
			});
			if (search) params.set('search', search);

			const res = await fetch(`/api/wallets?${params}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const data = await res.json();
			setWallets(data.wallets || []);
			setStats(data.stats || null);
			setPagination(data.pagination || null);
		} catch (err) {
			console.error('[useWallets] Fetch error:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch wallets');
		} finally {
			setLoading(false);
		}
	}, [limit, page, search]);

	useEffect(() => {
		fetchWallets();
	}, [fetchWallets]);

	return {
		wallets,
		stats,
		pagination,
		loading,
		error,
		refetch: fetchWallets,
		setPage,
		setSearch,
	};
}

// ────────────────────────────────────────────────────────────────────
// useWalletLookup — lookup a specific wallet + its transactions
// ────────────────────────────────────────────────────────────────────

interface UseWalletLookupReturn {
	user: WalletUserInfo | null;
	wallet: WalletDetail | null;
	transactions: WalletTransaction[];
	pagination: WalletPagination | null;
	loading: boolean;
	error: string | null;
	lookup: (query: string) => void;
	setPage: (page: number) => void;
	clear: () => void;
}

export function useWalletLookup(): UseWalletLookupReturn {
	const [query, setQuery] = useState<string | null>(null);
	const [user, setUser] = useState<WalletUserInfo | null>(null);
	const [wallet, setWallet] = useState<WalletDetail | null>(null);
	const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
	const [pagination, setPagination] = useState<WalletPagination | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);

	const fetchLookup = useCallback(async () => {
		if (!query) return;

		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				q: query,
				limit: '20',
				page: String(page),
			});

			const res = await fetch(`/api/wallets/lookup?${params}`);
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || `HTTP ${res.status}`);
			}

			const data = await res.json();
			setUser(data.user || null);
			setWallet(data.wallet || null);
			setTransactions(data.transactions || []);
			setPagination(data.pagination || null);
		} catch (err) {
			console.error('[useWalletLookup] Error:', err);
			setError(err instanceof Error ? err.message : 'Lookup failed');
			setUser(null);
			setWallet(null);
			setTransactions([]);
			setPagination(null);
		} finally {
			setLoading(false);
		}
	}, [query, page]);

	useEffect(() => {
		if (query) fetchLookup();
	}, [fetchLookup, query]);

	const lookup = useCallback((q: string) => {
		setPage(1);
		setQuery(q);
	}, []);

	const clear = useCallback(() => {
		setQuery(null);
		setUser(null);
		setWallet(null);
		setTransactions([]);
		setPagination(null);
		setError(null);
		setPage(1);
	}, []);

	return {
		user,
		wallet,
		transactions,
		pagination,
		loading,
		error,
		lookup,
		setPage,
		clear,
	};
}
