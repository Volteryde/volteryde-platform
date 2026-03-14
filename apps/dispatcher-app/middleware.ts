import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getAuthServiceUrl } from '@volteryde/config';

const AUTH_SERVICE_URL = getAuthServiceUrl();
const APP_ID = 'dispatcher-app';
const REQUIRED_ROLES = ['DISPATCHER', 'ADMIN', 'SUPER_ADMIN'];
const SESSION_COOKIE = '__volteryde_session';
const PUBLIC_PATHS = ['/_next', '/favicon.ico', '/api/health'];

// Allowed redirect targets (open-redirect guard)
const ALLOWED_REDIRECT_HOSTS = new Set([
	'volteryde.org',
	'admin.volteryde.org',
	'dispatch.volteryde.org',
	'support.volteryde.org',
	'partner.volteryde.org',
	'auth.volteryde.org',
	'localhost',
]);

function isSafeRedirectUrl(url: string): boolean {
	try {
		const { hostname } = new URL(url);
		return ALLOWED_REDIRECT_HOSTS.has(hostname) || hostname.endsWith('.volteryde.org');
	} catch {
		return false;
	}
}

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
		return NextResponse.next();
	}

	const token = request.cookies.get(SESSION_COOKIE)?.value;

	const buildLoginUrl = (extra?: Record<string, string>) => {
		const url = new URL('/login', AUTH_SERVICE_URL);
		url.searchParams.set('app', APP_ID);
		const rawRedirect = request.url;
		if (isSafeRedirectUrl(rawRedirect)) {
			url.searchParams.set('redirect_to', rawRedirect);
		}
		if (extra) {
			for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
		}
		return url;
	};

	if (!token) {
		return NextResponse.redirect(buildLoginUrl());
	}

	const secret = process.env.JWT_SECRET;
	if (!secret) {
		// Fail closed — cannot verify without the secret
		const res = NextResponse.redirect(buildLoginUrl());
		res.cookies.delete(SESSION_COOKIE);
		return res;
	}

	try {
		const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

		const roles = (payload.roles as string[] | undefined) ?? [];
		if (!roles.some(r => REQUIRED_ROLES.includes(r))) {
			const res = NextResponse.redirect(buildLoginUrl({ error: 'unauthorized' }));
			res.cookies.delete(SESSION_COOKIE);
			return res;
		}
	} catch {
		// Signature invalid, token expired, or any other jwtVerify failure
		const res = NextResponse.redirect(buildLoginUrl());
		res.cookies.delete(SESSION_COOKIE);
		return res;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
