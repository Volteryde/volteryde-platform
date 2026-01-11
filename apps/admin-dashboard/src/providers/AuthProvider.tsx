'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getConfig, getAuthServiceUrl } from '@volteryde/config';

// Get centralized config
const config = getConfig();

// User role type
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DISPATCHER' | 'SUPPORT_AGENT' | 'PARTNER' | 'DRIVER' | 'FLEET_MANAGER';

// Auth user type
interface AuthUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	roles: UserRole[];
	organizationId?: string;
	avatarUrl?: string;
	emailVerified: boolean;
}

// Auth state type
interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

// Auth context value type
interface AuthContextValue extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	hasRole: (role: UserRole) => boolean;
	hasAnyRole: (roles: UserRole[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextValue | null>(null);

// Storage prefix from config
const STORAGE_PREFIX = 'volteryde_auth_';

interface AuthProviderProps {
	children: ReactNode;
}

import { Suspense } from 'react';

// Inner component to handle URL params
function AuthInitializer({ children, setAuthState }: { children: ReactNode; setAuthState: (state: Partial<AuthState>) => void }) {
	const searchParams = useSearchParams();
	const router = useRouter();

	useEffect(() => {
		const initAuth = async () => {
			try {
				let token = localStorage.getItem(`${STORAGE_PREFIX}access_token`);
				const codeParam = searchParams.get('code');

				// If code param exists, it takes precedence (new login)
				if (codeParam) {
					token = codeParam;
					localStorage.setItem(`${STORAGE_PREFIX}access_token`, token);

					// Clean URL - remove code param without refresh
					const url = new URL(window.location.href);
					url.searchParams.delete('code');
					window.history.replaceState({}, '', url.pathname + url.search);
				}

				if (!token) {
					setAuthState({ isLoading: false });
					return;
				}

				// Decode token to get user info
				const parts = token.split('.');
				if (parts.length < 2) throw new Error('Invalid token format');
				const payload = parts[1];

				const decoded = JSON.parse(atob(payload));

				const user: AuthUser = {
					id: decoded.sub,
					email: decoded.email,
					firstName: decoded.firstName,
					lastName: decoded.lastName,
					roles: decoded.roles || [],
					organizationId: decoded.organizationId,
					emailVerified: decoded.emailVerified ?? true,
				};

				setAuthState({
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null,
				});
			} catch {
				setAuthState({ isLoading: false });
			}
		};

		initAuth();
	}, [searchParams, setAuthState]);

	return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [state, setState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		error: null,
	});

	const login = useCallback(async (email: string, password: string) => {
		setState(prev => ({ ...prev, isLoading: true, error: null }));

		try {
			// Use centralized auth API URL
			const response = await fetch(`${config.authApiUrl}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Login failed');
			}

			const data = await response.json();

			localStorage.setItem(`${STORAGE_PREFIX}access_token`, data.accessToken);
			localStorage.setItem(`${STORAGE_PREFIX}refresh_token`, data.refreshToken);

			const [, payload] = data.accessToken.split('.');
			const decoded = JSON.parse(atob(payload));

			setState({
				user: {
					id: decoded.sub,
					email: decoded.email,
					firstName: decoded.firstName,
					lastName: decoded.lastName,
					roles: decoded.roles || [],
					organizationId: decoded.organizationId,
					emailVerified: decoded.emailVerified ?? true,
				},
				isAuthenticated: true,
				isLoading: false,
				error: null,
			});
		} catch (err) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: err instanceof Error ? err.message : 'Login failed',
			}));
			throw err;
		}
	}, []);

	const logout = useCallback(async () => {
		// Clear localStorage tokens
		localStorage.removeItem(`${STORAGE_PREFIX}access_token`);
		localStorage.removeItem(`${STORAGE_PREFIX}refresh_token`);
		localStorage.removeItem(`${STORAGE_PREFIX}expires_at`);

		// Clear cookies (used by middleware)
		document.cookie = 'volteryde_auth_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

		setState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,
		});

		// Redirect to auth platform login page with logout flag
		if (typeof window !== 'undefined') {
			const authUrl = getAuthServiceUrl();
			// Add logout=true so auth-frontend clears its tokens too
			window.location.href = `${authUrl}/login?logout=true`;
		}
	}, []);

	const hasRole = useCallback((role: UserRole): boolean => {
		return state.user?.roles.includes(role) ?? false;
	}, [state.user]);

	const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
		return roles.some(role => state.user?.roles.includes(role));
	}, [state.user]);

	const updateAuthState = useCallback((newState: Partial<AuthState>) => {
		setState(prev => ({ ...prev, ...newState }));
	}, []);

	const contextValue: AuthContextValue = useMemo(
		() => ({
			...state,
			login,
			logout,
			hasRole,
			hasAnyRole,
		}),
		[state, login, logout, hasRole, hasAnyRole]
	);

	// Show loading state while initially loading (handled by inner component via state)
	if (state.isLoading) {
		return (
			<Suspense fallback={
				<div className="min-h-screen flex items-center justify-center bg-background">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
				</div>
			}>
				<AuthInitializer setAuthState={updateAuthState}>
					<div className="min-h-screen flex items-center justify-center bg-background">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
					</div>
				</AuthInitializer>
			</Suspense>
		);
	}

	return (
		<AuthContext.Provider value={contextValue}>
			{children}
		</AuthContext.Provider>
	);
}

// Hooks
export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

export function useUser(): AuthUser | null {
	const { user } = useAuth();
	return user;
}

export function useHasRole(role: UserRole | UserRole[]): boolean {
	const { hasRole, hasAnyRole } = useAuth();
	if (Array.isArray(role)) {
		return hasAnyRole(role);
	}
	return hasRole(role);
}
