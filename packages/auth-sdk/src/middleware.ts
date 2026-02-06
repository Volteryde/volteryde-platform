// ============================================================================
// Volteryde Auth SDK - Next.js Middleware
// ============================================================================

import type { AuthConfig, UserRole } from "./types";

interface MiddlewareConfig {
  /** Routes that require authentication */
  protectedRoutes?: string[];
  /** Routes that should redirect to home if already authenticated */
  authRoutes?: string[];
  /** Default redirect after login */
  afterLoginRedirect?: string;
  /** Login page path (on auth service) */
  loginPath?: string;
  /** Roles required for specific routes */
  roleRequirements?: Record<string, UserRole[]>;
}

/**
 * Create a middleware function for Next.js that handles auth redirects
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { createAuthMiddleware } from '@volteryde/auth-sdk';
 *
 * export const middleware = createAuthMiddleware({
 *   authServiceUrl: process.env.AUTH_SERVICE_URL!,
 *   appId: 'admin-dashboard',
 * }, {
 *   protectedRoutes: ['/dashboard', '/settings'],
 *   roleRequirements: {
 *     '/admin': ['SUPER_ADMIN', 'ADMIN'],
 *   },
 * });
 *
 * export const config = {
 *   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
 * };
 * ```
 */
export function createAuthMiddleware(
  authConfig: AuthConfig,
  middlewareConfig: MiddlewareConfig = {},
) {
  const {
    protectedRoutes = [],
    authRoutes = ["/login", "/register"],
    afterLoginRedirect = "/",
    loginPath = "/login",
    roleRequirements = {},
  } = middlewareConfig;

  // This returns a function compatible with Next.js middleware
  // The actual implementation depends on the Next.js middleware API
  return async function middleware(request: Request) {
    const { NextResponse } = await import("next/server");
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Get token from cookie or header
    const token = getTokenFromRequest(
      request,
      authConfig.storagePrefix ?? "volteryde_auth_",
    );

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route),
    );
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Check role requirements
    const requiredRoles = Object.entries(roleRequirements).find(([route]) =>
      pathname.startsWith(route),
    )?.[1];

    // If on auth route and already authenticated, redirect to dashboard
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL(afterLoginRedirect, request.url));
    }

    // If on protected route without token, redirect to auth service
    if (isProtectedRoute && !token) {
      const loginUrl = new URL(loginPath, authConfig.authServiceUrl);
      loginUrl.searchParams.set("app", authConfig.appId);
      loginUrl.searchParams.set("redirect", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If route requires specific roles, validate token
    if (requiredRoles && token) {
      const userRoles = parseRolesFromToken(token);
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        // Redirect to unauthorized page or home
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    return NextResponse.next();
  };
}

function getTokenFromRequest(request: Request, prefix: string): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=");
        return [key, val.join("=")];
      }),
    );
    return cookies[`${prefix}access_token`] ?? null;
  }

  return null;
}

function parseRolesFromToken(token: string): UserRole[] {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded.roles ?? [];
  } catch {
    return [];
  }
}
