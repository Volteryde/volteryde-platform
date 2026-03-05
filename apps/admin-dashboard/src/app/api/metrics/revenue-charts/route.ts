/**
 * GET /api/metrics/revenue-charts
 *
 * Austin — Consolidated endpoint that returns all chart data for the
 * admin dashboard: revenue graph, yearly breakup, and monthly earnings.
 *
 * All data is sourced from:
 *   - payment_db → svc_payment.payment_transactions  (completed deposits)
 *   - booking_db  → svc_booking.bookings              (completed trip fares)
 *
 * The "earnings" series uses payment_transactions (money IN).
 * We don't track expenses in the DB yet, so expense series returns zeros
 * as a placeholder — ready to be wired when operational cost tracking lands.
 *
 * Query params:
 *   ?year=2026        — optional, defaults to current year for the bar chart
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { QueryResult } from 'pg';
import { pool, queryDatabase } from '@/lib/db';

const SESSION_COOKIE = '__volteryde_session';
const PAYMENT_SCHEMA = process.env.PAYMENT_DATABASE_SCHEMA || 'svc_payment';
const BOOKING_SCHEMA = process.env.BOOKING_DATABASE_SCHEMA || 'svc_booking';

const MONTH_LABELS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export async function GET(request: NextRequest) {
	const token = request.cookies.get(SESSION_COOKIE)?.value;
	if (!token) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const currentYear = new Date().getFullYear();
	const requestedYear = Number(request.nextUrl.searchParams.get('year')) || currentYear;

	try {
		const results: QueryResult[] = await Promise.all([
			// ──────────────────────────────────────────────────────────
			// 1. Revenue graph — monthly earnings for the requested year
			//    from payment_transactions (deposits)
			// ──────────────────────────────────────────────────────────
			pool.query(`
				SELECT
					EXTRACT(MONTH FROM created_at)::int  AS month,
					COALESCE(SUM(amount), 0)             AS total
				FROM ${PAYMENT_SCHEMA}.payment_transactions
				WHERE UPPER(status) = 'COMPLETED'
				  AND EXTRACT(YEAR FROM created_at) = $1
				GROUP BY month
				ORDER BY month
			`, [requestedYear]),

			// Austin — Also pull booking fares per month (same year)
			queryDatabase('booking_db', `
				SELECT
					EXTRACT(MONTH FROM "createdAt")::int AS month,
					COALESCE(SUM(fare), 0)               AS total
				FROM ${BOOKING_SCHEMA}.bookings
				WHERE UPPER(status::text) = 'COMPLETED'
				  AND EXTRACT(YEAR FROM "createdAt") = $1
				GROUP BY month
				ORDER BY month
			`, [requestedYear]),

			// ──────────────────────────────────────────────────────────
			// 2. Yearly breakup — last 3 years of total revenue
			// ──────────────────────────────────────────────────────────
			pool.query(`
				SELECT
					EXTRACT(YEAR FROM created_at)::int AS year,
					COALESCE(SUM(amount), 0)           AS total
				FROM ${PAYMENT_SCHEMA}.payment_transactions
				WHERE UPPER(status) = 'COMPLETED'
				  AND EXTRACT(YEAR FROM created_at) >= $1
				GROUP BY year
				ORDER BY year
			`, [currentYear - 2]),

			// ──────────────────────────────────────────────────────────
			// 3. Monthly earnings sparkline — last 7 months
			// ──────────────────────────────────────────────────────────
			pool.query(`
				SELECT
					TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month_key,
					TO_CHAR(DATE_TRUNC('month', created_at), 'Mon')     AS month_label,
					COALESCE(SUM(amount), 0)                            AS total
				FROM ${PAYMENT_SCHEMA}.payment_transactions
				WHERE UPPER(status) = 'COMPLETED'
				  AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '6 months'
				GROUP BY month_key, month_label
				ORDER BY month_key
			`),

			// ──────────────────────────────────────────────────────────
			// 4. Austin — Earliest transaction year (for dynamic year dropdown)
			// ──────────────────────────────────────────────────────────
			pool.query(`
				SELECT COALESCE(MIN(EXTRACT(YEAR FROM created_at))::int, $1) AS min_year
				FROM ${PAYMENT_SCHEMA}.payment_transactions
				WHERE UPPER(status) = 'COMPLETED'
			`, [currentYear]),

			queryDatabase('booking_db', `
				SELECT COALESCE(MIN(EXTRACT(YEAR FROM "createdAt"))::int, $1) AS min_year
				FROM ${BOOKING_SCHEMA}.bookings
				WHERE UPPER(status::text) = 'COMPLETED'
			`, [currentYear]),
		]);

		// Austin — Destructure query results by index
		const [
			revenueByMonth,
			bookingByMonth,
			yearlyTotals,
			monthlySparkline,
			earliestPaymentYear,
			earliestBookingYear,
		] = results;

		// ── Build revenue chart data (bar chart, 12 months) ──────────
		// Austin — Determine the earliest year from both payment & booking data
		const paymentMinYear = parseInt(earliestPaymentYear.rows[0]?.min_year) || currentYear;
		const bookingMinYear = parseInt(earliestBookingYear.rows[0]?.min_year) || currentYear;
		const firstYear = Math.min(paymentMinYear, bookingMinYear);

		// Austin — Build available years: from first transaction year to current year
		const availableYears: number[] = [];
		for (let y = currentYear; y >= firstYear; y--) {
			availableYears.push(y);
		}

		const earningsMap = new Map<number, number>();
		const bookingMap = new Map<number, number>();

		for (const row of revenueByMonth.rows) {
			earningsMap.set(row.month, parseFloat(row.total) || 0);
		}
		for (const row of bookingByMonth.rows) {
			bookingMap.set(row.month, parseFloat(row.total) || 0);
		}

		// Austin — Combine deposits + booking fares as total "Earnings"
		const earningsData = MONTH_LABELS.map((_, i) => {
			const m = i + 1;
			return (earningsMap.get(m) || 0) + (bookingMap.get(m) || 0);
		});

		// Austin — Expense data is a placeholder until operational cost tracking is built
		const expenseData = MONTH_LABELS.map(() => 0);

		// ── Build yearly breakup (donut chart) ───────────────────────
		const yearMap = new Map<number, number>();
		for (const row of yearlyTotals.rows) {
			yearMap.set(row.year, parseFloat(row.total) || 0);
		}

		const years = [currentYear - 2, currentYear - 1, currentYear];
		const yearlyValues = years.map(y => yearMap.get(y) || 0);
		const yearlyTotal = yearlyValues.reduce((a, b) => a + b, 0);

		// Austin — YoY % change: compare current year vs previous year
		const thisYearTotal = yearMap.get(currentYear) || 0;
		const lastYearTotal = yearMap.get(currentYear - 1) || 0;
		const yoyChange = lastYearTotal > 0
			? ((thisYearTotal - lastYearTotal) / lastYearTotal) * 100
			: thisYearTotal > 0 ? 100 : 0;

		// ── Build monthly earnings sparkline ─────────────────────────
		const sparklineData = monthlySparkline.rows.map(r => parseFloat(r.total) || 0);
		const sparklineLabels = monthlySparkline.rows.map(r => r.month_label);

		// Austin — Current month total & MoM change
		const currentMonthTotal = sparklineData.length > 0
			? sparklineData[sparklineData.length - 1]
			: 0;
		const previousMonthTotal = sparklineData.length > 1
			? sparklineData[sparklineData.length - 2]
			: 0;
		const momChange = previousMonthTotal > 0
			? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
			: currentMonthTotal > 0 ? 100 : 0;

		return NextResponse.json({
			// Austin — Dynamic years for the dropdown (first transaction → current)
			availableYears,

			// Revenue bar chart
			revenueChart: {
				year: requestedYear,
				categories: MONTH_LABELS,
				earnings: earningsData,
				expenses: expenseData,
			},

			// Yearly breakup donut
			yearlyBreakup: {
				years: years.map(String),
				values: yearlyValues,
				total: yearlyTotal,
				yoyChangePercent: Math.round(yoyChange * 10) / 10,
			},

			// Monthly earnings sparkline
			monthlyEarnings: {
				labels: sparklineLabels,
				data: sparklineData,
				currentMonth: currentMonthTotal,
				momChangePercent: Math.round(momChange * 10) / 10,
			},

			currency: 'GHS',
			queriedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('[revenue-charts] Query failed:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json(
			{ error: 'Failed to fetch chart data', details: message },
			{ status: 500 },
		);
	}
}
