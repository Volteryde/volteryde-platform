'use client';

// ============================================================================
// Volteryde Auth SDK - Higher-Order Component
// ============================================================================

import React, { type ComponentType } from 'react';
import { useAuth } from './auth-provider';
import type { AuthUser, UserRole } from './types';

export interface WithAuthProps {
	user: AuthUser;
}

interface WithAuthOptions {
	/** Required roles to access the component */
	roles?: UserRole[];
	/** Component to show while loading */
	LoadingComponent?: ComponentType;
	/** Component to show when unauthorized */
	UnauthorizedComponent?: ComponentType;
	/** Redirect to login if not authenticated */
	redirectToLogin?: boolean;
}

/**
 * Higher-order component that wraps a component with authentication
 * 
 * @example
 * ```tsx
 * const AdminPanel = withAuth(
 *   ({ user }) => <div>Welcome, Admin {user.firstName}!</div>,
 *   { roles: ['ADMIN', 'SUPER_ADMIN'] }
 * );
 * ```
 */
export function withAuth<P extends WithAuthProps>(
	WrappedComponent: ComponentType<P>,
	options: WithAuthOptions = {}
): ComponentType<Omit<P, keyof WithAuthProps>> {
	const {
		roles,
		LoadingComponent,
		UnauthorizedComponent,
		redirectToLogin = true,
	} = options;

	function WithAuthComponent(props: Omit<P, keyof WithAuthProps>) {
		const { user, isAuthenticated, isLoading, hasAnyRole } = useAuth();

		// Show loading state
		if (isLoading) {
			if (LoadingComponent) {
				return <LoadingComponent />;
			}
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
				</div>
			);
		}

		// Not authenticated
		if (!isAuthenticated || !user) {
			if (redirectToLogin) {
				// This would typically trigger a redirect in the auth provider
				return null;
			}
			if (UnauthorizedComponent) {
				return <UnauthorizedComponent />;
			}
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-xl font-semibold">Authentication Required</h2>
						<p className="text-gray-600 mt-2">Please log in to access this page.</p>
					</div>
				</div>
			);
		}

		// Check role requirements
		if (roles && roles.length > 0 && !hasAnyRole(roles)) {
			if (UnauthorizedComponent) {
				return <UnauthorizedComponent />;
			}
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-xl font-semibold">Access Denied</h2>
						<p className="text-gray-600 mt-2">
							You do not have permission to access this page.
						</p>
					</div>
				</div>
			);
		}

		// Render the wrapped component with the user prop
		return <WrappedComponent {...(props as P)} user={user} />;
	}

	WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'
		})`;

	return WithAuthComponent;
}
