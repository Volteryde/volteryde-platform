import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthServiceUrl } from '@volteryde/config';

// Auth service URL
const AUTH_SERVICE_URL = getAuthServiceUrl();

// Paths that don't require authentication
const PUBLIC_PATHS = ['/_next', '/favicon.ico', '/api/health'];

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Skip middleware for public paths and static assets
	if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	// Check for auth code in URL (SSO callback from auth platform)
	const code = request.nextUrl.searchParams.get('code');
	if (code) {
		// Auth callback - store token in cookie and remove code from URL
		const cleanUrl = new URL(pathname, request.url);
		const response = NextResponse.redirect(cleanUrl);

		// Set auth token cookie
		response.cookies.set('volteryde_auth_access_token', code, {
			httpOnly: false, // Need to access from client-side
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24, // 24 hours
			path: '/',
		});

		return response;
	}

	// Check for existing token in cookie
	const token = request.cookies.get('volteryde_auth_access_token')?.value;

	if (!token) {
		// No token - redirect to auth platform login
		const loginUrl = new URL('/login', AUTH_SERVICE_URL);
		loginUrl.searchParams.set('app', 'admin-dashboard');
		loginUrl.searchParams.set('redirect', request.url);
		return NextResponse.redirect(loginUrl);
	}

	// Optional: Validate token expiry (basic check)
	try {
		const [, payload] = token.split('.');
		const decoded = JSON.parse(atob(payload));
		const expiry = decoded.exp * 1000; // Convert to milliseconds

		if (Date.now() > expiry) {
			// Token expired - clear cookie and redirect to login
			const response = NextResponse.redirect(new URL('/login', AUTH_SERVICE_URL));
			response.cookies.delete('volteryde_auth_access_token');
			return response;
		}
	} catch {
		// Invalid token format - clear and redirect
		const loginUrl = new URL('/login', AUTH_SERVICE_URL);
		const response = NextResponse.redirect(loginUrl);
		response.cookies.delete('volteryde_auth_access_token');
		return response;
	}

	// Token is valid, allow access
	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
};
