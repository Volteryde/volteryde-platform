/**
 * FinanceMetrics — Live financial dashboard cards.
 *
 * Austin — This client component fetches from /api/metrics/finance
 * and renders the Total Real Revenue and Total System Balance cards
 * with live data from the svc_payment and svc_booking schemas.
 *
 * Refreshes every 60 seconds while the tab is active.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { MetricCard } from './MetricCard';

interface FinanceData {
	totalRealRevenue: {
		amount: number;
		transactionCount: number;
	};
	totalSystemBalance: {
		amount: number;
		realBalance: number;
		promoBalance: number;
		walletCount: number;
	};
	totalBookingRevenue: {
		amount: number;
		bookingCount: number;
	};
	currency: string;
	queriedAt: string;
}

// Austin — Format number as currency (GHS by default)
function formatCurrency(amount: number, currency = 'GHS'): string {
	return new Intl.NumberFormat('en-GH', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

// Austin — Polling interval (60s)
const REFRESH_INTERVAL_MS = 60_000;

export default function FinanceMetrics() {
	const [data, setData] = useState<FinanceData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchMetrics = useCallback(async () => {
		try {
			const res = await fetch('/api/metrics/finance', { cache: 'no-store' });

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || `HTTP ${res.status}`);
			}

			const json: FinanceData = await res.json();
			setData(json);
			setError(null);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load';
			setError(message);
			console.error('[FinanceMetrics] fetch failed:', message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Initial fetch
		fetchMetrics();

		// Austin — Auto-refresh every 60s
		const interval = setInterval(fetchMetrics, REFRESH_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [fetchMetrics]);

	const currency = data?.currency || 'GHS';

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{/* Austin — Total Real Revenue: actual customer deposits */}
			<MetricCard
				title="Total Real Revenue"
				amount={data ? formatCurrency(data.totalRealRevenue.amount, currency) : '—'}
				description="Total deposited amounts by customers (Mirroring)"
				detail={
					data
						? `${data.totalRealRevenue.transactionCount} completed transaction${data.totalRealRevenue.transactionCount !== 1 ? 's' : ''}`
						: undefined
				}
				color="text-green-600"
				tooltipText="Revenue generated from actual customer deposits. Sourced from svc_payment.payment_transactions where status = COMPLETED."
				isLoading={isLoading}
				error={error}
			/>

			{/* Austin — Total System Balance: real + promo balances across all wallets */}
			<MetricCard
				title="Total System Balance"
				amount={data ? formatCurrency(data.totalSystemBalance.amount, currency) : '—'}
				description="Total value in system"
				detail={
					data
						? `${data.totalSystemBalance.walletCount} customer${data.totalSystemBalance.walletCount !== 1 ? 's' : ''} · Real: ${formatCurrency(data.totalSystemBalance.realBalance, currency)} · Promo: ${formatCurrency(data.totalSystemBalance.promoBalance, currency)}`
						: undefined
				}
				color="text-blue-600"
				tooltipText="Includes all deposited amounts, plus compensations, free ride balances, and system credits. We mirror monetary value to allow flexibility in user account population. Sourced from svc_payment.wallet_balances."
				isLoading={isLoading}
				error={error}
			/>
		</div>
	);
}
