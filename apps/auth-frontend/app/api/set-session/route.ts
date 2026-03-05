import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// In-memory, per-IP. Resets on cold start (acceptable — real brute-force
// protection lives on the Spring Boot auth service that issues the token).
// 5 set-session calls per 10 minutes per IP is very generous for legitimate use.

interface RateBucket {
	count: number;
	resetAt: number;
}
const rlStore = new Map<string, RateBucket>();
const RL_MAX = 5;           // max attempts
const RL_WINDOW = 10 * 60 * 1000; // 10 minutes in ms

// Prune old entries every 100 calls to prevent unbounded memory growth
let pruneCounter = 0;
function pruneStore() {
	if (++pruneCounter % 100 !== 0) return;
	const now = Date.now();
	for (const [key, bucket] of rlStore.entries()) {
		if (now > bucket.resetAt) rlStore.delete(key);
	}
}

function checkRateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
	pruneStore();
	const now = Date.now();
	const bucket = rlStore.get(ip);

	if (!bucket || now > bucket.resetAt) {
		rlStore.set(ip, { count: 1, resetAt: now + RL_WINDOW });
		return { ok: true, retryAfterSec: 0 };
	}
	if (bucket.count >= RL_MAX) {
		return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
	}
	bucket.count++;
	return { ok: true, retryAfterSec: 0 };
}

// ─── JWT Validation ───────────────────────────────────────────────────────────

interface JwtPayload {
	sub?: string;
	exp?: number;
	iat?: number;
	roles?: unknown;
	[key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		// Base64url → Base64 → JSON
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = Buffer.from(base64, 'base64').toString('utf-8');
		return JSON.parse(json) as JwtPayload;
	} catch {
		return null;
	}
}

function validateToken(token: string): { valid: boolean; reason?: string; expiresIn?: number } {
	if (!token || typeof token !== 'string') {
		return { valid: false, reason: 'Missing token' };
	}

	// Must be a three-part JWT
	if (token.split('.').length !== 3) {
		return { valid: false, reason: 'Malformed token' };
	}

	const payload = decodeJwtPayload(token);
	if (!payload) {
		return { valid: false, reason: 'Unreadable token payload' };
	}

	const now = Math.floor(Date.now() / 1000);

	// Required claim: sub (user id)
	if (!payload.sub || typeof payload.sub !== 'string') {
		return { valid: false, reason: 'Missing subject claim' };
	}

	// Required claim: exp
	if (typeof payload.exp !== 'number') {
		return { valid: false, reason: 'Missing expiry claim' };
	}

	// Token must not be expired
	if (payload.exp <= now) {
		return { valid: false, reason: 'Token has expired' };
	}

	// Token must not expire unreasonably far in the future (max 7 days)
	if (payload.exp > now + 7 * 24 * 60 * 60) {
		return { valid: false, reason: 'Token lifetime too long' };
	}

	// iat must not be in the future (clock skew tolerance: 60 s)
	if (typeof payload.iat === 'number' && payload.iat > now + 60) {
		return { valid: false, reason: 'Token issued in the future' };
	}

	// iat must not be older than 7 days
	if (typeof payload.iat === 'number' && payload.iat < now - 7 * 24 * 60 * 60) {
		return { valid: false, reason: 'Token too old' };
	}

	// roles must be a non-empty array of strings
	if (
		!Array.isArray(payload.roles) ||
		payload.roles.length === 0 ||
		!payload.roles.every(r => typeof r === 'string')
	) {
		return { valid: false, reason: 'Missing or invalid roles claim' };
	}

	const expiresIn = payload.exp - now;
	return { valid: true, expiresIn };
}

// ─── Allowed redirect origins (open-redirect guard) ───────────────────────────
const ALLOWED_HOSTS = new Set([
	'volteryde.org',
	'admin.volteryde.org',
	'dispatch.volteryde.org',
	'support.volteryde.org',
	'partner.volteryde.org',
	'auth.volteryde.org',
]);

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/set-session
 * Validates the JWT from the auth service then persists it as an httpOnly
 * cookie shared across all *.volteryde.org subdomains.
 */
export async function POST(request: NextRequest) {
	// 1. Rate limit by IP
	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		'unknown';

	const rl = checkRateLimit(ip);
	if (!rl.ok) {
		return NextResponse.json(
			{ error: 'Too many requests. Please wait before trying again.' },
			{
				status: 429,
				headers: {
					'Retry-After': String(rl.retryAfterSec),
					'X-RateLimit-Limit': String(RL_MAX),
					'X-RateLimit-Remaining': '0',
				},
			},
		);
	}

	// 2. Parse body
	let body: { token?: unknown };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
	}

	// 3. Validate token
	const token = body.token;
	if (typeof token !== 'string') {
		return NextResponse.json({ error: 'token must be a string' }, { status: 400 });
	}

	const validation = validateToken(token);
	if (!validation.valid) {
		// Don't leak the exact reason in production to avoid oracle attacks
		const reason = isProd ? 'Invalid token' : validation.reason;
		return NextResponse.json({ error: reason }, { status: 401 });
	}

	// 4. Set the shared httpOnly session cookie
	const maxAge = validation.expiresIn!;
	const response = NextResponse.json({ success: true });
	response.cookies.set('__volteryde_session', token, {
		httpOnly: true,
		secure: isProd,
		sameSite: 'lax',
		maxAge,
		path: '/',
		...(isProd && { domain: '.volteryde.org' }),
	});

	return response;
}

/**
 * DELETE /api/set-session
 * Clears the session cookie on logout.
 */
export async function DELETE() {
	const response = NextResponse.json({ success: true });
	response.cookies.set('__volteryde_session', '', {
		httpOnly: true,
		secure: isProd,
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
		...(isProd && { domain: '.volteryde.org' }),
	});
	return response;
}
