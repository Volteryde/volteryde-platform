/**
 * Austin — Wallets API endpoint.
 *
 * Lists CLIENT-only wallets with their balances, joined with user info.
 * Only users with role='CLIENT' should have wallets on VolteRyde.
 * Also returns aggregate stats (total balance across platform, wallet count).
 *
 * Query params:
 *   ?limit=20      — number of wallets per page (default 20, max 100)
 *   ?page=1        — page number for pagination
 *   ?search=       — optional search by user name, email, or user_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool, queryDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
		const page = Math.max(Number(searchParams.get('page') || 1), 1);
		const search = searchParams.get('search')?.trim() || null;
		const offset = (page - 1) * limit;

		// Austin — Fetch all wallet balances from payment_db
		const walletsResult = await pool.query(
			`SELECT
				id::text,
				customer_id,
				real_balance,
				promo_balance,
				(real_balance + promo_balance) AS total_balance,
				created_at,
				updated_at
			FROM svc_payment.wallet_balances
			ORDER BY updated_at DESC`,
		);

		// Austin — Collect customer_ids to batch-fetch user info
		const customerIds = walletsResult.rows
			.map((w) => w.customer_id)
			.filter(Boolean);

		let userMap: Record<string, {
			name: string;
			email: string;
			userId: string;
			role: string;
			status: string;
		}> = {};

		if (customerIds.length > 0) {
			const placeholders = customerIds.map((_: string, i: number) => `$${i + 1}`).join(', ');
			try {
				const userResult = await queryDatabase(
					'user_db',
					`SELECT id::text, user_id, first_name, last_name, email, role, status
					 FROM svc_users.users
					 WHERE id::text IN (${placeholders})`,
					customerIds,
				);

				for (const u of userResult.rows) {
					const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown';
					userMap[u.id] = {
						name,
						email: u.email || '',
						userId: u.user_id || '',
						role: u.role || '',
						status: u.status || '',
					};
				}
			} catch {
				// Austin — user_db may not have matching records; continue gracefully
			}
		}

		// Austin — Merge wallet + user data, only include CLIENT wallets
		let wallets = walletsResult.rows
			.map((w) => {
				const user = userMap[w.customer_id] || {
					name: 'Unknown User',
					email: '',
					userId: '',
					role: '',
					status: '',
				};
				return {
					id: w.id,
					customerId: w.customer_id,
					userName: user.name,
					email: user.email,
					userId: user.userId,
					role: user.role,
					userStatus: user.status,
					realBalance: parseFloat(w.real_balance) || 0,
					promoBalance: parseFloat(w.promo_balance) || 0,
					totalBalance: parseFloat(w.total_balance) || 0,
					createdAt: w.created_at,
					updatedAt: w.updated_at,
				};
			})
			// Austin — Only CLIENT users should have wallets; filter out admins, drivers, etc.
			.filter((w) => w.role === 'CLIENT' || w.role === '');

		// Austin — Apply search filter if provided (searches user name, email, user_id)
		if (search) {
			const q = search.toLowerCase();
			wallets = wallets.filter(
				(w) =>
					w.userName.toLowerCase().includes(q) ||
					w.email.toLowerCase().includes(q) ||
					w.userId.toLowerCase().includes(q) ||
					w.customerId.toLowerCase().includes(q),
			);
		}

		// Austin — Compute stats from the CLIENT-only wallet list (not raw SQL)
		// This ensures stats only reflect client wallets, not admin/driver wallets
		const computedStats = {
			walletCount: wallets.length,
			totalRealBalance: wallets.reduce((sum, w) => sum + w.realBalance, 0),
			totalPromoBalance: wallets.reduce((sum, w) => sum + w.promoBalance, 0),
			totalPlatformBalance: wallets.reduce((sum, w) => sum + w.totalBalance, 0),
		};

		// Paginate
		const totalCount = wallets.length;
		const paginated = wallets.slice(offset, offset + limit);
		const totalPages = Math.ceil(totalCount / limit);

		return NextResponse.json({
			wallets: paginated,
			stats: computedStats,
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
		console.error('[wallets] Error:', err);
		return NextResponse.json(
			{ error: 'Failed to fetch wallets' },
			{ status: 500 },
		);
	}
}
