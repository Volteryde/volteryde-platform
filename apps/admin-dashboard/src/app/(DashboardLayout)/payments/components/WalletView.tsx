'use client';

/**
 * Austin — Wallets tab on the /payments page.
 *
 * Features:
 *   1. Aggregate stats cards (total wallets, total real balance, promo balance, platform balance)
 *   2. Wallet lookup — search by user_id, email, or UUID to drill into a single wallet
 *   3. Wallet list — paginated table of all wallets with user info
 *   4. Wallet detail panel — shows wallet balance + full transaction history when looked up
 */

import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Search, Wallet, X, ArrowLeft } from 'lucide-react';
import { useWallets, useWalletLookup } from '@/hooks/useWallets';

// Austin — Format currency values consistently
function formatGHS(amount: number): string {
	return `GH₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

function formatTime(dateStr: string): string {
	return new Date(dateStr)
		.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
		.toLowerCase();
}

// Austin — Badge variant based on transaction status
function txStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (status) {
		case 'SUCCESS': return 'default';
		case 'PENDING': case 'PROCESSING': return 'secondary';
		case 'FAILED': return 'destructive';
		case 'REFUNDED': return 'outline';
		default: return 'secondary';
	}
}

export function WalletView() {
	const {
		wallets,
		stats,
		pagination,
		loading: walletsLoading,
		setPage,
		setSearch: setWalletSearch,
	} = useWallets({ limit: 15 });

	const {
		user: lookupUser,
		wallet: lookupWallet,
		transactions: lookupTx,
		pagination: lookupPagination,
		loading: lookupLoading,
		error: lookupError,
		lookup,
		setPage: setLookupPage,
		clear: clearLookup,
	} = useWalletLookup();

	const [searchInput, setSearchInput] = useState('');
	const [walletFilterInput, setWalletFilterInput] = useState('');
	const [showDetail, setShowDetail] = useState(false);

	// Austin — Handle wallet lookup form submit
	const handleLookup = (e: FormEvent) => {
		e.preventDefault();
		if (!searchInput.trim()) return;
		lookup(searchInput.trim());
		setShowDetail(true);
	};

	// Austin — Handle clicking a wallet row to drill down
	const handleWalletClick = (customerId: string) => {
		setSearchInput(customerId);
		lookup(customerId);
		setShowDetail(true);
	};

	// Austin — Back button from detail view
	const handleBack = () => {
		setShowDetail(false);
		clearLookup();
		setSearchInput('');
	};

	// Austin — Handle wallet list search/filter
	const handleWalletFilter = (value: string) => {
		setWalletFilterInput(value);
		setWalletSearch(value);
	};

	// ──────────────────────────────────────────────────────────────
	// DETAIL VIEW — Shows when a wallet is looked up
	// ──────────────────────────────────────────────────────────────
	if (showDetail) {
		return (
			<div className="space-y-4">
				<Button variant="outline" size="sm" onClick={handleBack}>
					<ArrowLeft className="mr-2 h-4 w-4" /> Back to Wallets
				</Button>

				{lookupLoading && (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
						<span className="ml-2 text-sm text-muted-foreground">Looking up wallet...</span>
					</div>
				)}

				{lookupError && (
					<Card>
						<CardContent className="py-8 text-center text-sm text-destructive">
							{lookupError}
						</CardContent>
					</Card>
				)}

				{/* Austin — User info + wallet balance */}
				{lookupUser && (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">User</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-lg font-bold">{lookupUser.name}</p>
								<p className="text-xs text-muted-foreground">{lookupUser.email}</p>
								<p className="text-xs text-muted-foreground mt-1">
									{lookupUser.userId} · <Badge variant="outline" className="text-xs">{lookupUser.role}</Badge>
								</p>
							</CardContent>
						</Card>

						{lookupWallet && (
							<>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">Real Balance</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">{formatGHS(lookupWallet.realBalance)}</p>
										<p className="text-xs text-muted-foreground">Cash balance</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">Promo Balance</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">{formatGHS(lookupWallet.promoBalance)}</p>
										<p className="text-xs text-muted-foreground">Promotional credits</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">Total Balance</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-primary">{formatGHS(lookupWallet.totalBalance)}</p>
										<p className="text-xs text-muted-foreground">Combined balance</p>
									</CardContent>
								</Card>
							</>
						)}

						{!lookupWallet && !lookupLoading && (
							<Card className="col-span-3">
								<CardContent className="py-6 text-center text-sm text-muted-foreground">
									No wallet found for this user. Wallet is created on first top-up.
								</CardContent>
							</Card>
						)}
					</div>
				)}

				{/* Austin — Transaction history for this wallet */}
				{lookupTx.length > 0 && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Transaction History</CardTitle>
								{lookupPagination && (
									<span className="text-sm text-muted-foreground">
										{lookupPagination.totalCount} transactions
									</span>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Source</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Description</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{lookupTx.map((tx) => (
										<TableRow key={tx.id}>
											<TableCell>
												<Badge variant="outline" className="text-xs capitalize">
													{tx.source}
												</Badge>
											</TableCell>
											<TableCell className="text-sm">{tx.type}</TableCell>
											<TableCell className="text-sm max-w-[200px] truncate">
												{tx.description}
											</TableCell>
											<TableCell className="font-semibold">
												{formatGHS(tx.amount)}
											</TableCell>
											<TableCell>
												<Badge variant={txStatusVariant(tx.status)}>
													{tx.status}
												</Badge>
											</TableCell>
											<TableCell className="text-sm">
												{formatDate(tx.createdAt)}{' '}
												<span className="text-muted-foreground">{formatTime(tx.createdAt)}</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Pagination for wallet transactions */}
							{lookupPagination && lookupPagination.totalPages > 1 && (
								<div className="flex items-center justify-between pt-4 border-t mt-4">
									<span className="text-sm text-muted-foreground">
										Page {lookupPagination.page} of {lookupPagination.totalPages}
									</span>
									<div className="flex gap-2">
										<button
											onClick={() => setLookupPage(lookupPagination.page - 1)}
											disabled={!lookupPagination.hasPrev}
											className="px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
										>
											← Previous
										</button>
										<button
											onClick={() => setLookupPage(lookupPagination.page + 1)}
											disabled={!lookupPagination.hasNext}
											className="px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Next →
										</button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{!lookupLoading && lookupTx.length === 0 && lookupUser && (
					<Card>
						<CardContent className="py-8 text-center text-sm text-muted-foreground">
							No transactions recorded for this wallet yet.
						</CardContent>
					</Card>
				)}
			</div>
		);
	}

	// ──────────────────────────────────────────────────────────────
	// LIST VIEW — Default view with stats + wallet table
	// ──────────────────────────────────────────────────────────────
	return (
		<div className="space-y-4">
			{/* Austin — Aggregate stats + Lookup */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{/* Total Wallets */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Client Wallets</CardTitle>
						<Wallet className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{walletsLoading ? (
							<div className="h-8 w-24 bg-muted animate-pulse rounded" />
						) : (
							<>
								<div className="text-2xl font-bold">{stats?.walletCount ?? 0}</div>
								<p className="text-xs text-muted-foreground">Registered client wallets</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Real Balance */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Real Balance</CardTitle>
					</CardHeader>
					<CardContent>
						{walletsLoading ? (
							<div className="h-8 w-32 bg-muted animate-pulse rounded" />
						) : (
							<>
								<div className="text-2xl font-bold">{formatGHS(stats?.totalRealBalance ?? 0)}</div>
								<p className="text-xs text-muted-foreground">Cash across all wallets</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Promo Balance */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Promo Balance</CardTitle>
					</CardHeader>
					<CardContent>
						{walletsLoading ? (
							<div className="h-8 w-32 bg-muted animate-pulse rounded" />
						) : (
							<>
								<div className="text-2xl font-bold">{formatGHS(stats?.totalPromoBalance ?? 0)}</div>
								<p className="text-xs text-muted-foreground">Promotional credits</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Platform Total */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Platform Balance</CardTitle>
					</CardHeader>
					<CardContent>
						{walletsLoading ? (
							<div className="h-8 w-32 bg-muted animate-pulse rounded" />
						) : (
							<>
								<div className="text-2xl font-bold text-primary">
									{formatGHS(stats?.totalPlatformBalance ?? 0)}
								</div>
								<p className="text-xs text-muted-foreground">Real + Promo combined</p>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Austin — Wallet Lookup (CLIENT only) */}
			<Card>
				<CardHeader>
					<CardTitle>Lookup Client Wallet</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLookup} className="flex w-full max-w-lg items-center space-x-2">
						<Input
							type="text"
							placeholder="Enter Client ID (e.g. VR-C123456), email, or UUID"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
						<Button type="submit" disabled={lookupLoading || !searchInput.trim()}>
							<Search className="mr-2 h-4 w-4" />
							{lookupLoading ? 'Searching...' : 'Lookup'}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Austin — Client Wallets Table */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Client Wallets</CardTitle>
						<div className="flex items-center gap-2">
							<Input
								type="text"
								placeholder="Filter wallets..."
								value={walletFilterInput}
								onChange={(e) => handleWalletFilter(e.target.value)}
								className="w-48 h-8 text-sm"
							/>
							{walletFilterInput && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleWalletFilter('')}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{walletsLoading && wallets.length === 0 && (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
							<span className="ml-2 text-sm text-muted-foreground">Loading wallets...</span>
						</div>
					)}

					{!walletsLoading && wallets.length === 0 && (
						<div className="text-center py-12 text-sm text-muted-foreground">
							No wallets found. Wallets are created when users make their first top-up.
						</div>
					)}

					{wallets.length > 0 && (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>User</TableHead>
										<TableHead>User ID</TableHead>
										<TableHead>Real Balance</TableHead>
										<TableHead>Promo Balance</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Last Updated</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{wallets.map((w) => (
										<TableRow
											key={w.id}
											className="cursor-pointer hover:bg-muted/50"
											onClick={() => handleWalletClick(w.customerId)}
										>
											<TableCell>
												<div>
													<p className="font-medium">{w.userName}</p>
													<p className="text-xs text-muted-foreground">{w.email}</p>
												</div>
											</TableCell>
											<TableCell className="text-sm">{w.userId || '—'}</TableCell>
											<TableCell className="font-semibold">{formatGHS(w.realBalance)}</TableCell>
											<TableCell>{formatGHS(w.promoBalance)}</TableCell>
											<TableCell className="font-bold text-primary">
												{formatGHS(w.totalBalance)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{w.updatedAt ? formatDate(w.updatedAt) : '—'}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Pagination */}
							{pagination && pagination.totalPages > 1 && (
								<div className="flex items-center justify-between pt-4 border-t mt-4">
									<span className="text-sm text-muted-foreground">
										Page {pagination.page} of {pagination.totalPages}
									</span>
									<div className="flex gap-2">
										<button
											onClick={() => setPage(pagination.page - 1)}
											disabled={!pagination.hasPrev}
											className="px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
										>
											← Previous
										</button>
										<button
											onClick={() => setPage(pagination.page + 1)}
											disabled={!pagination.hasNext}
											className="px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Next →
										</button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
