'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { getConfig } from '@volteryde/config';

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

export function AuthProvider({ children }: AuthProviderProps) {
	const [state, setState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		error: null,
	});

	// Initialize auth state from storage
	useEffect(() => {
		const initAuth = async () => {
			try {
				const token = localStorage.getItem(`${STORAGE_PREFIX}access_token`);

				if (!token) {
					setState(prev => ({ ...prev, isLoading: false }));
					return;
				}

				// Decode token to get user info
				const [, payload] = token.split('.');
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

				setState({
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null,
				});
			} catch {
				setState(prev => ({ ...prev, isLoading: false }));
			}
		};

		initAuth();
	}, []);

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
		localStorage.removeItem(`${STORAGE_PREFIX}access_token`);
		localStorage.removeItem(`${STORAGE_PREFIX}refresh_token`);

		setState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,
		});

		// Redirect to auth service using centralized config
		if (typeof window !== 'undefined') {
			const loginUrl = new URL('/login', config.authServiceUrl);
			loginUrl.searchParams.set('app', 'admin-dashboard');
			loginUrl.searchParams.set('redirect', window.location.href);
			window.location.href = loginUrl.toString();
		}
	}, []);

	const hasRole = useCallback((role: UserRole): boolean => {
		return state.user?.roles.includes(role) ?? false;
	}, [state.user]);

	const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
		return roles.some(role => state.user?.roles.includes(role));
	}, [state.user]);

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

	// Show loading state
	if (state.isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
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
