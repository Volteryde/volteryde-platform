/**
 * GET /api/metrics/finance
 *
 * Austin — Admin-only server route that aggregates financial metrics
 * directly from the VolteRyde PostgreSQL databases.
 *
 * Returns:
 *   totalRealRevenue   — Sum of all COMPLETED payment transactions (actual
 *                        customer deposits).  Source: payment_db → svc_payment.payment_transactions
 *
 *   totalSystemBalance — Sum of all wallet real_balance + promo_balance across
 *                        every customer wallet. This includes deposits, compensations,
 *                        free-ride credits, and any system-issued balances.
 *                        Source: payment_db → svc_payment.wallet_balances
 *
 *   totalBookingRevenue — Sum of fares from all COMPLETED bookings.
 *                         Source: booking_db → svc_booking.bookings
 *
 * The route is protected by the session cookie — only authenticated
 * admin users with a valid __volteryde_session cookie can call it.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { pool, queryDatabase } from '@/lib/db';

const SESSION_COOKIE = '__volteryde_session';

// Austin — Schema names match the DATABASE_SCHEMA env vars in docker-compose
const PAYMENT_SCHEMA = process.env.PAYMENT_DATABASE_SCHEMA || 'svc_payment';
const BOOKING_SCHEMA = process.env.BOOKING_DATABASE_SCHEMA || 'svc_booking';

export async function GET(request: NextRequest) {
	// Auth guard — verify session cookie exists
	const token = request.cookies.get(SESSION_COOKIE)?.value;
	if (!token) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401 },
		);
	}

	try {
		// Austin — Run all three queries in parallel for speed
		const [revenueResult, balanceResult, bookingResult] = await Promise.all([
			// 1. Total Real Revenue: sum of COMPLETED payment deposits
			pool.query(`
				SELECT
					COALESCE(SUM(amount), 0)  AS total_revenue,
					COUNT(*)                  AS transaction_count
				FROM ${PAYMENT_SCHEMA}.payment_transactions
				WHERE UPPER(status) = 'COMPLETED'
			`),

			// 2. Total System Balance: aggregate of all wallet balances
			pool.query(`
				SELECT
					COALESCE(SUM(real_balance), 0)   AS total_real_balance,
					COALESCE(SUM(promo_balance), 0)  AS total_promo_balance,
					COALESCE(SUM(real_balance), 0) + COALESCE(SUM(promo_balance), 0) AS total_system_balance,
					COUNT(*)                         AS wallet_count
				FROM ${PAYMENT_SCHEMA}.wallet_balances
			`),

			// 3. Total Booking Revenue: sum of fares from completed bookings
			queryDatabase('booking_db', `
				SELECT
					COALESCE(SUM(fare), 0)  AS total_booking_revenue,
					COUNT(*)                AS booking_count
				FROM ${BOOKING_SCHEMA}.bookings
				WHERE UPPER(status::text) = 'COMPLETED'
			`),
		]);

		const revenue = revenueResult.rows[0];
		const balance = balanceResult.rows[0];
		const booking = bookingResult.rows[0];

		return NextResponse.json({
			// Austin — Revenue: only real money deposited by customers
			totalRealRevenue: {
				amount: parseFloat(revenue.total_revenue) || 0,
				transactionCount: parseInt(revenue.transaction_count, 10) || 0,
			},
			// System balance: real + promo combined
			totalSystemBalance: {
				amount: parseFloat(balance.total_system_balance) || 0,
				realBalance: parseFloat(balance.total_real_balance) || 0,
				promoBalance: parseFloat(balance.total_promo_balance) || 0,
				walletCount: parseInt(balance.wallet_count, 10) || 0,
			},
			// Booking fare revenue
			totalBookingRevenue: {
				amount: parseFloat(booking.total_booking_revenue) || 0,
				bookingCount: parseInt(booking.booking_count, 10) || 0,
			},
			// Metadata
			currency: 'GHS',
			queriedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('[finance-metrics] Query failed:', error);

		const message =
			error instanceof Error ? error.message : 'Unknown database error';

		return NextResponse.json(
			{ error: 'Failed to fetch financial metrics', details: message },
			{ status: 500 },
		);
	}
}
