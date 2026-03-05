/**
 * Austin — Wallet Lookup API endpoint.
 *
 * Looks up a specific CLIENT wallet by user_id, email, or customer UUID.
 * Only CLIENT role users can have wallets — admins, drivers, etc. are rejected.
 * Returns the wallet balance + ALL transactions (wallet_transactions +
 * payment_transactions) for that customer.
 *
 * Query params:
 *   ?q=VR-A123456   — user_id, email, or customer UUID
 *   ?limit=20       — transactions per page (default 20, max 100)
 *   ?page=1         — page number
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool, queryDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const query = searchParams.get('q')?.trim();
		const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
		const page = Math.max(Number(searchParams.get('page') || 1), 1);
		const offset = (page - 1) * limit;

		if (!query) {
			return NextResponse.json(
				{ error: 'Missing required query parameter: q (user_id, email, or UUID)' },
				{ status: 400 },
			);
		}

		// Austin — Step 1: Resolve the customer UUID from user_db
		// The query could be a user_id (VR-A123), email, or raw UUID
		let customerId: string | null = null;
		let userInfo: {
			id: string;
			userId: string;
			name: string;
			email: string;
			phone: string;
			role: string;
			status: string;
		} | null = null;

		try {
			const userResult = await queryDatabase(
				'user_db',
				`SELECT id::text, user_id, first_name, last_name, email, phone_number, role, status
				 FROM svc_users.users
				 WHERE (user_id = $1
				    OR LOWER(email) = LOWER($1)
				    OR id::text = $1)
				 LIMIT 1`,
				[query],
			);

			if (userResult.rows.length > 0) {
				const u = userResult.rows[0];

				// Austin — Only CLIENT users can have wallets.
				// Reject lookups for admins, drivers, fleet managers, etc.
				if (u.role !== 'CLIENT') {
					return NextResponse.json(
						{ error: `User "${query}" is a ${u.role}, not a CLIENT. Only clients have wallets.` },
						{ status: 400 },
					);
				}

				customerId = u.id;
				userInfo = {
					id: u.id,
					userId: u.user_id,
					name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown',
					email: u.email || '',
					phone: u.phone_number || '',
					role: u.role || '',
					status: u.status || '',
				};
			}
		} catch {
			// Austin — user_db lookup failed; try treating query as a raw customer_id
		}

		// Austin — If user not found in user_db, try direct customer_id match in payment_db
		if (!customerId) {
			const walletCheck = await pool.query(
				`SELECT customer_id FROM svc_payment.wallet_balances WHERE customer_id = $1 LIMIT 1`,
				[query],
			);
			if (walletCheck.rows.length > 0) {
				customerId = walletCheck.rows[0].customer_id;
			}
		}

		if (!customerId) {
			return NextResponse.json(
				{ error: `No user or wallet found for: "${query}"` },
				{ status: 404 },
			);
		}

		// Austin — Step 2: Fetch the wallet balance
		const walletResult = await pool.query(
			`SELECT
				id::text,
				customer_id,
				real_balance,
				promo_balance,
				(real_balance + promo_balance) AS total_balance,
				created_at,
				updated_at
			FROM svc_payment.wallet_balances
			WHERE customer_id = $1`,
			[customerId],
		);

		const wallet = walletResult.rows[0]
			? {
					id: walletResult.rows[0].id,
					customerId: walletResult.rows[0].customer_id,
					realBalance: parseFloat(walletResult.rows[0].real_balance) || 0,
					promoBalance: parseFloat(walletResult.rows[0].promo_balance) || 0,
					totalBalance: parseFloat(walletResult.rows[0].total_balance) || 0,
					createdAt: walletResult.rows[0].created_at,
					updatedAt: walletResult.rows[0].updated_at,
				}
			: null;

		// Austin — Step 3: Fetch ALL transactions for this customer
		// Combine wallet_transactions + payment_transactions, sorted by newest
		const [walletTxResult, paymentTxResult] = await Promise.all([
			pool.query(
				`SELECT
					id::text,
					amount,
					type,
					balance_type,
					description,
					reference_id,
					created_at
				FROM svc_payment.wallet_transactions
				WHERE customer_id = $1
				ORDER BY created_at DESC`,
				[customerId],
			),
			pool.query(
				`SELECT
					id::text,
					amount,
					currency,
					status,
					description,
					reference,
					provider,
					provider_reference,
					created_at
				FROM svc_payment.payment_transactions
				WHERE customer_id = $1
				ORDER BY created_at DESC`,
				[customerId],
			),
		]);

		// Austin — Normalize into unified transaction format
		interface WalletTxRow {
			id: string;
			amount: string;
			type: string;
			balance_type: string;
			description: string | null;
			reference_id: string | null;
			created_at: string;
		}

		interface PaymentTxRow {
			id: string;
			amount: string;
			currency: string;
			status: string;
			description: string | null;
			reference: string | null;
			provider: string;
			provider_reference: string | null;
			created_at: string;
		}

		const transactions = [
			...walletTxResult.rows.map((r: WalletTxRow) => ({
				id: `wal_${r.id}`,
				source: 'wallet' as const,
				type: r.type,
				balanceType: r.balance_type || null,
				description: r.description || `${r.type} - ${r.balance_type || 'wallet'}`,
				amount: parseFloat(r.amount) || 0,
				currency: 'GHS',
				status: 'SUCCESS',
				reference: r.reference_id || null,
				createdAt: r.created_at,
			})),
			...paymentTxResult.rows.map((r: PaymentTxRow) => ({
				id: `pay_${r.id}`,
				source: 'payment' as const,
				type: r.status === 'REFUNDED' ? 'REFUND' : 'PAYMENT',
				balanceType: null,
				description: r.description || `Payment via ${r.provider}`,
				amount: parseFloat(r.amount) || 0,
				currency: r.currency || 'GHS',
				status: r.status,
				reference: r.reference || r.provider_reference || null,
				createdAt: r.created_at,
			})),
		];

		// Sort by newest first
		transactions.sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		// Paginate
		const totalCount = transactions.length;
		const paginated = transactions.slice(offset, offset + limit);
		const totalPages = Math.ceil(totalCount / limit);

		return NextResponse.json({
			user: userInfo,
			wallet,
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
		console.error('[wallet-lookup] Error:', err);
		return NextResponse.json(
			{ error: 'Failed to lookup wallet' },
			{ status: 500 },
		);
	}
}
