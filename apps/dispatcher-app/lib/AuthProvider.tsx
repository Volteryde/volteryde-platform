'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { getAuthServiceUrl } from '@volteryde/config';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DISPATCHER' | 'SUPPORT_AGENT' | 'PARTNER' | 'DRIVER' | 'FLEET_MANAGER';

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

interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

interface AuthContextValue extends AuthState {
	logout: () => Promise<void>;
	hasRole: (role: UserRole) => boolean;
	hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
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

	useEffect(() => {
		const initAuth = async () => {
			try {
				const getCookie = (name: string) => {
					const value = `; ${document.cookie}`;
					const parts = value.split(`; ${name}=`);
					if (parts.length === 2) return parts.pop()?.split(';').shift();
					return null;
				};

				const token = getCookie('volteryde_auth_access_token') ||
					localStorage.getItem(`${STORAGE_PREFIX}access_token`);

				if (!token) {
					setState(prev => ({ ...prev, isLoading: false }));
					return;
				}

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

	const logout = useCallback(async () => {
		localStorage.removeItem(`${STORAGE_PREFIX}access_token`);
		localStorage.removeItem(`${STORAGE_PREFIX}refresh_token`);
		localStorage.removeItem(`${STORAGE_PREFIX}expires_at`);
		document.cookie = 'volteryde_auth_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

		setState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,
		});

		// Redirect to auth platform with logout flag

		// Redirect to auth platform with logout flag
		if (typeof window !== 'undefined') {
			const authUrl = getAuthServiceUrl();
			window.location.href = `${authUrl}/login?logout=true`;
		}
	}, []);

	const hasRole = useCallback((role: UserRole): boolean => {
		return state.user?.roles.includes(role) ?? false;
	}, [state.user]);

	const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
		return roles.some(role => state.user?.roles.includes(role));
	}, [state.user]);

	const contextValue: AuthContextValue = useMemo(
		() => ({ ...state, logout, hasRole, hasAnyRole }),
		[state, logout, hasRole, hasAnyRole]
	);

	if (state.isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');
	return context;
}

export function useUser(): AuthUser | null {
	const { user } = useAuth();
	return user;
}
