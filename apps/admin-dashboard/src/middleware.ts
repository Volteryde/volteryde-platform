import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Can't use @volteryde/config directly in middleware Edge runtime
// These values are read from environment variables set in .env.central
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://auth.volteryde.org';
const PUBLIC_PATHS = ['/auth', '/_next', '/favicon.ico', '/api'];

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Skip middleware for public paths
	if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	// Check for auth code in URL (SSO callback)
	const code = request.nextUrl.searchParams.get('code');
	if (code) {
		// Auth callback - store token and continue
		const response = NextResponse.redirect(new URL(pathname, request.url));
		response.cookies.set('volteryde_auth_access_token', code, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24, // 24 hours
		});
		return response;
	}

	// Check for existing token
	const token = request.cookies.get('volteryde_auth_access_token')?.value;

	if (!token) {
		// Redirect to auth service using centralized URL
		const loginUrl = new URL('/login', AUTH_SERVICE_URL);
		loginUrl.searchParams.set('app', 'admin-dashboard');
		loginUrl.searchParams.set('redirect', request.url);
		return NextResponse.redirect(loginUrl);
	}

	// Token exists, allow access
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
