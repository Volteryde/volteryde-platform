import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = '__volteryde_session';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Decode a JWT payload (base64url → JSON).
 * Does NOT verify the signature — that's the middleware's job.
 */
function decodePayload(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = Buffer.from(base64, 'base64').toString('utf-8');
		return JSON.parse(json) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/**
 * GET /api/session
 *
 * Reads the httpOnly session cookie set by auth-frontend,
 * decodes the JWT, and returns user data + the raw token
 * so client components can attach it to API calls.
 *
 * The cookie is httpOnly so JavaScript can't read it directly —
 * this server-side route is the only way for the client to
 * obtain the token after login.
 */
export async function GET(request: NextRequest) {
	const token = request.cookies.get(SESSION_COOKIE)?.value;

	if (!token) {
		return NextResponse.json(
			{ authenticated: false, error: 'No session' },
			{ status: 401 },
		);
	}

	const payload = decodePayload(token);
	if (!payload) {
		return NextResponse.json(
			{ authenticated: false, error: 'Invalid session' },
			{ status: 401 },
		);
	}

	// Check expiry
	const exp = payload.exp as number | undefined;
	if (typeof exp === 'number' && Date.now() > exp * 1000) {
		// Clear expired cookie
		const res = NextResponse.json(
			{ authenticated: false, error: 'Session expired' },
			{ status: 401 },
		);
		res.cookies.set(SESSION_COOKIE, '', {
			httpOnly: true,
			secure: isProd,
			sameSite: 'lax',
			maxAge: 0,
			path: '/',
			...(isProd && { domain: '.volteryde.org' }),
		});
		return res;
	}

	return NextResponse.json({
		authenticated: true,
		token,
		user: {
			id: payload.sub,
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
			roles: payload.roles ?? [],
			organizationId: payload.organizationId ?? null,
			emailVerified: payload.emailVerified ?? true,
		},
	});
}

/**
 * DELETE /api/session
 *
 * Clears the session cookie on logout.
 */
export async function DELETE() {
	const res = NextResponse.json({ success: true });
	res.cookies.set(SESSION_COOKIE, '', {
		httpOnly: true,
		secure: isProd,
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
		...(isProd && { domain: '.volteryde.org' }),
	});
	return res;
}
