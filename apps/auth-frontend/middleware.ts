import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Edge-level Rate Limiter ──────────────────────────────────────────────────
// Runs on Vercel Edge before any route handler.
// Limits: 20 requests / 5 min per IP on any /api/ route (e.g. set-session).
// Note: Edge functions are regional — this is a per-PoP limit. For a global
// distributed limit, add Upstash Redis. This layer is a solid first defense.

const RL_MAP = new Map<string, { count: number; resetAt: number }>();
const RL_MAX = 20;
const RL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function edgeRateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
	const now = Date.now();
	const entry = RL_MAP.get(ip);

	if (!entry || now > entry.resetAt) {
		RL_MAP.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
		return { ok: true, retryAfterSec: 0 };
	}
	if (entry.count >= RL_MAX) {
		return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
	}
	entry.count++;
	return { ok: true, retryAfterSec: 0 };
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Only rate-limit API routes — pages are not sensitive in the same way
	if (!pathname.startsWith('/api/')) {
		return NextResponse.next();
	}

	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		'unknown';

	const rl = edgeRateLimit(ip);
	if (!rl.ok) {
		return new NextResponse(
			JSON.stringify({ error: 'Too many requests. Try again shortly.' }),
			{
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': String(rl.retryAfterSec),
					'X-RateLimit-Limit': String(RL_MAX),
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': String(Math.ceil((Date.now() + rl.retryAfterSec * 1000) / 1000)),
				},
			},
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/api/:path*'],
};
