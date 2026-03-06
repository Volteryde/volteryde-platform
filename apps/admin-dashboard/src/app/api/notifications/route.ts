/**
 * GET /api/notifications
 *
 * Aggregates real system events from the VolteRyde databases and returns
 * them as a unified notification feed for the admin dashboard.
 *
 * Sources:
 *   - payment_db → svc_payment.payment_transactions  (failed payments)
 *   - booking_db → svc_booking.bookings              (cancelled / completed bookings)
 *   - volteryde_user_management → public.users       (newly created staff accounts)
 *
 * Returns the latest 20 notifications sorted newest-first.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { pool, queryDatabase } from '@/lib/db';

const SESSION_COOKIE = '__volteryde_session';
const PAYMENT_SCHEMA = process.env.PAYMENT_DATABASE_SCHEMA || 'svc_payment';
const BOOKING_SCHEMA = process.env.BOOKING_DATABASE_SCHEMA || 'svc_booking';

export type NotificationType = 'user_created' | 'error' | 'success' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	subtitle: string;
	time: string;       // ISO timestamp
	read: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	if (diffSec < 60) return 'Just now';
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin} min ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr} hr ago`;
	const diffDay = Math.floor(diffHr / 24);
	return `${diffDay}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const token = request.cookies.get(SESSION_COOKIE)?.value;
	if (!token) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const notifications: Notification[] = [];

	// ── 1. Failed payment transactions (last 7 days) ──────────────────────────
	try {
		const failedPayments = await pool.query(`
			SELECT
				id::text,
				COALESCE(metadata->>'userEmail', 'Unknown user') AS user_email,
				amount,
				created_at
			FROM ${PAYMENT_SCHEMA}.payment_transactions
			WHERE UPPER(status) = 'FAILED'
			  AND created_at >= NOW() - INTERVAL '7 days'
			ORDER BY created_at DESC
			LIMIT 5
		`);

		for (const row of failedPayments.rows) {
			const date = new Date(row.created_at);
			notifications.push({
				id: `pay-fail-${row.id}`,
				type: 'error',
				title: 'Payment transaction failed',
				subtitle: `${row.user_email} — GHS ${parseFloat(row.amount).toFixed(2)}`,
				time: date.toISOString(),
				read: false,
			});
		}
	} catch {
		// non-critical — skip if payment DB unavailable
	}

	// ── 2. Cancelled bookings (last 7 days) ───────────────────────────────────
	try {
		const cancelled = await queryDatabase('booking_db', `
			SELECT
				id::text,
				COALESCE("userId", 'Unknown')  AS user_id,
				COALESCE(fare::text, '0')       AS fare,
				"createdAt"
			FROM ${BOOKING_SCHEMA}.bookings
			WHERE UPPER(status::text) = 'CANCELLED'
			  AND "createdAt" >= NOW() - INTERVAL '7 days'
			ORDER BY "createdAt" DESC
			LIMIT 5
		`);

		for (const row of cancelled.rows) {
			const date = new Date(row.createdAt);
			notifications.push({
				id: `booking-cancel-${row.id}`,
				type: 'error',
				title: 'Booking cancelled',
				subtitle: `Booking by user ${row.user_id} — GHS ${parseFloat(row.fare).toFixed(2)}`,
				time: date.toISOString(),
				read: false,
			});
		}
	} catch {
		// non-critical
	}

	// ── 3. Recently completed bookings (last 24 h) ────────────────────────────
	try {
		const completed = await queryDatabase('booking_db', `
			SELECT
				id::text,
				COALESCE("userId", 'Unknown')  AS user_id,
				COALESCE(fare::text, '0')       AS fare,
				"createdAt"
			FROM ${BOOKING_SCHEMA}.bookings
			WHERE UPPER(status::text) = 'COMPLETED'
			  AND "createdAt" >= NOW() - INTERVAL '24 hours'
			ORDER BY "createdAt" DESC
			LIMIT 5
		`);

		for (const row of completed.rows) {
			const date = new Date(row.createdAt);
			notifications.push({
				id: `booking-done-${row.id}`,
				type: 'success',
				title: 'Ride completed',
				subtitle: `User ${row.user_id} — GHS ${parseFloat(row.fare).toFixed(2)}`,
				time: date.toISOString(),
				read: false,
			});
		}
	} catch {
		// non-critical
	}

	// ── 4. Newly created staff users (last 7 days) ────────────────────────────
	try {
		const newUsers = await queryDatabase('volteryde_user_management', `
			SELECT
				id::text,
				first_name,
				last_name,
				email,
				role,
				created_at
			FROM public.users
			WHERE created_at >= NOW() - INTERVAL '7 days'
			ORDER BY created_at DESC
			LIMIT 5
		`);

		for (const row of newUsers.rows) {
			const date = new Date(row.created_at);
			notifications.push({
				id: `user-new-${row.id}`,
				type: 'user_created',
				title: 'New user registered',
				subtitle: `${row.first_name} ${row.last_name} joined as ${row.role === 'CUSTOMER_SUPPORT' ? 'CUSTOMER CARE' : (row.role as string).replace(/_/g, ' ')}`,
				time: date.toISOString(),
				read: false,
			});
		}
	} catch {
		// non-critical — user-management DB may be unavailable in dev
	}

	// ── Sort newest-first, cap at 20 ─────────────────────────────────────────
	notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
	const top20 = notifications.slice(0, 20).map(n => ({
		...n,
		time: relativeTime(new Date(n.time)),
	}));

	return NextResponse.json({ notifications: top20 });
}
