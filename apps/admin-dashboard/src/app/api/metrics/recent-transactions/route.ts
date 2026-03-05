/**
 * Austin — Recent Transactions API endpoint.
 *
 * Aggregates transactions from ALL platform sources:
 *   1. svc_payment.payment_transactions (Paystack payments, refunds)
 *   2. svc_payment.wallet_transactions  (wallet credits/debits, promos, support top-ups)
 *   3. svc_booking.bookings             (ride bookings with fare info)
 *
 * User names are resolved from user_db.svc_users.users via customer_id / userId.
 *:qw
 * Query params:
 *   ?limit=6       — number of rows (default 10)
 *   ?page=1        — page number for pagination (default 1)
 *   ?status=SUCCESS — optional filter by status
 *   ?source=payment|wallet|booking — optional filter by transaction source
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool, queryDatabase } from '@/lib/db';

// Austin — Unified transaction shape returned to the client
interface UnifiedTransaction {
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

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const limit = Math.min(Number(searchParams.get('limit') || 10), 50);
		const page = Math.max(Number(searchParams.get('page') || 1), 1);
		const statusFilter = searchParams.get('status')?.toUpperCase() || null;
		const sourceFilter = searchParams.get('source')?.toLowerCase() || null; // Austin — filter by source: payment, wallet, booking
		const offset = (page - 1) * limit;

		// Austin — Fetch from all 3 sources in parallel.
		// We over-fetch from each source to build a proper merged + sorted result.
		const fetchLimit = limit + offset + 20; // buffer for merge-sort across sources

		const [paymentRows, walletRows, bookingRows] = await Promise.all([
			// 1. Payment transactions (Paystack)
			pool.query(
				`SELECT
					id::text,
					amount,
					currency,
					status,
					description,
					reference,
					customer_id,
					created_at
				FROM svc_payment.payment_transactions
				ORDER BY created_at DESC
				LIMIT $1`,
				[fetchLimit],
			),

			// 2. Wallet transactions (credits, debits, promos, support additions)
			pool.query(
				`SELECT
					id::text,
					amount,
					type,
					balance_type,
					description,
					reference_id,
					customer_id,
					created_at
				FROM svc_payment.wallet_transactions
				ORDER BY created_at DESC
				LIMIT $1`,
				[fetchLimit],
			),

			// 3. Bookings (ride fare transactions)
			queryDatabase(
				'booking_db',
				`SELECT
					id::text,
					fare,
					status,
					"userId" AS user_id,
					"createdAt" AS created_at,
					"paymentId" AS payment_id
				FROM svc_booking.bookings
				ORDER BY "createdAt" DESC
				LIMIT $1`,
				[fetchLimit],
			),
		]);

		// Austin — Collect all unique customer IDs across sources to batch-fetch user names
		const customerIds = new Set<string>();
		for (const r of paymentRows.rows) if (r.customer_id) customerIds.add(r.customer_id);
		for (const r of walletRows.rows) if (r.customer_id) customerIds.add(r.customer_id);
		for (const r of bookingRows.rows) if (r.user_id) customerIds.add(r.user_id);

		// Austin — Batch-fetch user names from user_db
		let userMap: Record<string, string> = {};
		if (customerIds.size > 0) {
			const idArray = Array.from(customerIds);
			const placeholders = idArray.map((_, i) => `$${i + 1}`).join(', ');

			try {
				const userResult = await queryDatabase(
					'user_db',
					`SELECT id::text, user_id, first_name, last_name
					 FROM svc_users.users
					 WHERE id::text IN (${placeholders}) OR user_id IN (${placeholders})`,
					[...idArray, ...idArray],
				);

				for (const u of userResult.rows) {
					const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown User';
					if (u.id) userMap[u.id] = name;
					if (u.user_id) userMap[u.user_id] = name;
				}
			} catch {
				// Austin — user_db might not have matching records; continue with 'Unknown'
			}
		}

		// Austin — Normalize all sources into a unified shape
		const unified: UnifiedTransaction[] = [];

		// Payment transactions
		for (const r of paymentRows.rows) {
			unified.push({
				id: `pay_${r.id}`,
				source: 'payment',
				userName: userMap[r.customer_id] || 'Unknown User',
				type: derivePaymentType(r.status, r.description),
				description: r.description || `Payment ${r.reference || ''}`.trim(),
				amount: parseFloat(r.amount) || 0,
				currency: r.currency || 'GHS',
				status: normalizeStatus(r.status),
				createdAt: r.created_at,
			});
		}

		// Wallet transactions
		for (const r of walletRows.rows) {
			unified.push({
				id: `wal_${r.id}`,
				source: 'wallet',
				userName: userMap[r.customer_id] || 'Unknown User',
				type: deriveWalletType(r.type, r.balance_type, r.description),
				description: r.description || `${r.type} - ${r.balance_type || 'wallet'}`,
				amount: parseFloat(r.amount) || 0,
				currency: 'GHS',
				status: 'SUCCESS', // wallet transactions are always settled
				createdAt: r.created_at,
			});
		}

		// Booking transactions
		for (const r of bookingRows.rows) {
			unified.push({
				id: `book_${r.id}`,
				source: 'booking',
				userName: userMap[r.user_id] || 'Unknown User',
				type: 'Ride Booking',
				description: `Ride booking${r.payment_id ? ` (Pay: ${r.payment_id})` : ''}`,
				amount: parseFloat(r.fare) || 0,
				currency: 'GHS',
				status: normalizeStatus(r.status),
				createdAt: r.created_at,
			});
		}

		// Austin — Sort all transactions by newest first
		unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		// Apply optional status filter
		let filtered = statusFilter
			? unified.filter((t) => t.status === statusFilter)
			: unified;

		// Austin — Apply optional source filter (payment, wallet, booking)
		if (sourceFilter && ['payment', 'wallet', 'booking'].includes(sourceFilter)) {
			filtered = filtered.filter((t) => t.source === sourceFilter);
		}

		// Paginate
		const totalCount = filtered.length;
		const paginated = filtered.slice(offset, offset + limit);
		const totalPages = Math.ceil(totalCount / limit);

		return NextResponse.json({
			transactions: paginated,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		});
	} catch (err) {
		console.error('[recent-transactions] Error:', err);
		return NextResponse.json(
			{ error: 'Failed to fetch transactions' },
			{ status: 500 },
		);
	}
}

// Austin — Derive a human-readable type label for payment transactions
function derivePaymentType(status: string, description?: string): string {
	const desc = (description || '').toLowerCase();
	if (desc.includes('refund') || status === 'REFUNDED') return 'Refund';
	if (desc.includes('promo') || desc.includes('bonus')) return 'Promo Credit';
	if (desc.includes('top') && desc.includes('up')) return 'Wallet Top-up';
	if (desc.includes('ride') || desc.includes('fare')) return 'Ride Payment';
	return 'Payment';
}

// Austin — Derive a human-readable type label for wallet transactions
function deriveWalletType(type: string, balanceType?: string, description?: string): string {
	const desc = (description || '').toLowerCase();
	if (desc.includes('promo') || desc.includes('bonus')) return 'Promo Credit';
	if (desc.includes('support') || desc.includes('admin')) return 'Support Credit';
	if (desc.includes('ride') || desc.includes('fare')) return 'Ride Deduction';
	if (type === 'CREDIT') return 'Wallet Top-up';
	if (type === 'DEBIT') return 'Wallet Debit';
	return `Wallet ${type}`;
}

// Austin — Normalize status strings across different source schemas
function normalizeStatus(status: string): string {
	if (!status) return 'UNKNOWN';
	const s = status.toUpperCase();
	switch (s) {
		case 'SUCCESS':
		case 'COMPLETED':
		case 'CONFIRMED':
			return 'SUCCESS';
		case 'PENDING':
		case 'PROCESSING':
		case 'IN_PROGRESS':
			return 'PENDING';
		case 'FAILED':
		case 'CANCELLED':
			return 'FAILED';
		case 'REFUNDED':
			return 'REFUNDED';
		default:
			return s;
	}
}
