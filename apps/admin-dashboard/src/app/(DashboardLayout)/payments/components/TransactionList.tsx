'use client';

/**
 * Austin — Full paginated transaction list for the /payments page.
 *
 * Fetches ALL transaction types across the platform:
 *   - Payment transactions (Paystack)
 *   - Wallet credits/debits (promos, support, top-ups)
 *   - Ride bookings
 *
 * Supports pagination + source/status filters.
 */

import { useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';

// Austin — Map transaction status to badge variant for visual distinction
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (status) {
		case 'SUCCESS':
			return 'default';
		case 'PENDING':
			return 'secondary';
		case 'FAILED':
			return 'destructive';
		case 'REFUNDED':
			return 'outline';
		default:
			return 'secondary';
	}
}

// Austin — Format ISO date to readable date string
function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

// Austin — Format time portion
function formatTime(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	}).toLowerCase();
}

const ITEMS_PER_PAGE = 15;

// Austin — Filter options for transaction source
const SOURCE_OPTIONS = [
	{ value: '', label: 'All Sources' },
	{ value: 'payment', label: 'Payments (Paystack)' },
	{ value: 'wallet', label: 'Wallet Transactions' },
	{ value: 'booking', label: 'Ride Bookings' },
] as const;

const STATUS_OPTIONS = [
	{ value: '', label: 'All Statuses' },
	{ value: 'SUCCESS', label: 'Success' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'FAILED', label: 'Failed' },
	{ value: 'REFUNDED', label: 'Refunded' },
] as const;

export function TransactionList() {
	const [sourceFilter, setSourceFilter] = useState<string>('');
	const [statusFilter, setStatusFilter] = useState<string>('');

	const { transactions, pagination, loading, error, setPage } =
		useRecentTransactions({
			limit: ITEMS_PER_PAGE,
			page: 1,
			source: sourceFilter || null,
			status: statusFilter || null,
			autoRefreshMs: 3 * 60 * 1000, // Austin — refresh every 3 minutes
		});

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between flex-wrap gap-3">
					<div className="flex items-center gap-3">
						<CardTitle>All Transactions</CardTitle>
						{pagination && (
							<span className="text-sm text-muted-foreground">
								({pagination.totalCount} total)
							</span>
						)}
					</div>

					{/* Austin — Filter controls */}
					<div className="flex items-center gap-2">
						<select
							value={sourceFilter}
							onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
							className="h-8 px-2 text-sm rounded-md border border-input bg-background"
						>
							{SOURCE_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>
						<select
							value={statusFilter}
							onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
							className="h-8 px-2 text-sm rounded-md border border-input bg-background"
						>
							{STATUS_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{/* Loading state */}
				{loading && transactions.length === 0 && (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
						<span className="ml-2 text-sm text-muted-foreground">
							Loading transactions...
						</span>
					</div>
				)}

				{/* Error state */}
				{error && !loading && (
					<div className="text-center py-12 text-sm text-destructive">
						Failed to load transactions. Please try again.
					</div>
				)}

				{/* Empty state */}
				{!loading && !error && transactions.length === 0 && (
					<div className="text-center py-12 text-sm text-muted-foreground">
						No transactions recorded yet.
					</div>
				)}

				{/* Austin — Transaction table */}
				{transactions.length > 0 && (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Source</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Time</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((tx) => (
									<TableRow key={tx.id}>
										<TableCell className="font-medium">
											{tx.userName}
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="text-xs capitalize">
												{tx.source}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="text-sm">{tx.type}</span>
										</TableCell>
										<TableCell>
											<span className="font-semibold">
												GH₵{tx.amount.toFixed(2)}
											</span>
										</TableCell>
										<TableCell>
											<Badge variant={statusVariant(tx.status)}>
												{tx.status}
											</Badge>
										</TableCell>
										<TableCell>{formatDate(tx.createdAt)}</TableCell>
										<TableCell className="text-muted-foreground">
											{formatTime(tx.createdAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{/* Austin — Pagination controls */}
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
	);
}
