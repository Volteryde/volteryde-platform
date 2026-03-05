import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthServiceUrl } from '@volteryde/config';

const AUTH_SERVICE_URL = getAuthServiceUrl();
const APP_ID = 'customer-and-support-app';
const REQUIRED_ROLES = ['SYSTEM_SUPPORT', 'CUSTOMER_SUPPORT', 'ADMIN', 'SUPER_ADMIN'];
const SESSION_COOKIE = '__volteryde_session';
const PUBLIC_PATHS = ['/_next', '/favicon.ico', '/api/health'];

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
		return NextResponse.next();
	}

	const token = request.cookies.get(SESSION_COOKIE)?.value;

	if (!token) {
		const loginUrl = new URL('/login', AUTH_SERVICE_URL);
		loginUrl.searchParams.set('app', APP_ID);
		loginUrl.searchParams.set('redirect_to', request.url);
		return NextResponse.redirect(loginUrl);
	}

	try {
		const [, payload] = token.split('.');
		const decoded = JSON.parse(atob(payload));

		if (Date.now() > decoded.exp * 1000) {
			const loginUrl = new URL('/login', AUTH_SERVICE_URL);
			loginUrl.searchParams.set('app', APP_ID);
			loginUrl.searchParams.set('redirect_to', request.url);
			const response = NextResponse.redirect(loginUrl);
			response.cookies.delete(SESSION_COOKIE);
			return response;
		}

		const roles: string[] = decoded.roles || [];
		if (!roles.some(r => REQUIRED_ROLES.includes(r))) {
			const loginUrl = new URL('/login', AUTH_SERVICE_URL);
			loginUrl.searchParams.set('app', APP_ID);
			loginUrl.searchParams.set('error', 'unauthorized');
			const response = NextResponse.redirect(loginUrl);
			response.cookies.delete(SESSION_COOKIE);
			return response;
		}
	} catch {
		const loginUrl = new URL('/login', AUTH_SERVICE_URL);
		const response = NextResponse.redirect(loginUrl);
		response.cookies.delete(SESSION_COOKIE);
		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
