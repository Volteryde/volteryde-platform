'use client';

// ============================================================================
// Volteryde Auth SDK - React Provider
// ============================================================================

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useMemo,
	type ReactNode,
} from 'react';
import type {
	AuthConfig,
	AuthState,
	AuthContextValue,
	AuthUser,
	UserRole,
	LoginRequest,
	RegisterRequest,
} from './types';
import { AuthClient } from './auth-client';

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
	children: ReactNode;
	config: AuthConfig;
	/**
	 * If true, automatically redirect to login when not authenticated
	 */
	requireAuth?: boolean;
	/**
	 * Custom loading component while checking auth status
	 */
	loadingComponent?: ReactNode;
}

/**
 * Authentication Provider for React applications
 * 
 * Wraps your app and provides authentication state and methods
 * 
 * @example
 * ```tsx
 * <AuthProvider config={{ authServiceUrl: 'https://auth.volteryde.org', appId: 'admin-dashboard' }}>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({
	children,
	config,
	requireAuth = false,
	loadingComponent,
}: AuthProviderProps) {
	const [state, setState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		error: null,
	});

	const authClient = useMemo(() => new AuthClient(config), [config]);

	// Initialize auth state on mount
	useEffect(() => {
		const initAuth = async () => {
			try {
				// Check for auth callback code in URL
				const urlParams = new URLSearchParams(window.location.search);
				const code = urlParams.get('code');

				if (code) {
					// Handle OAuth callback
					const user = await authClient.handleAuthCallback(code);
					setState({
						user,
						isAuthenticated: true,
						isLoading: false,
						error: null,
					});

					// Clean up URL
					const cleanUrl = window.location.pathname;
					window.history.replaceState({}, document.title, cleanUrl);
					return;
				}

				// Check existing session
				if (authClient.isAuthenticated()) {
					// Refresh if needed
					if (authClient.needsRefresh()) {
						await authClient.refreshToken();
					}

					const user = authClient.getCurrentUser();
					setState({
						user,
						isAuthenticated: true,
						isLoading: false,
						error: null,
					});
				} else {
					setState({
						user: null,
						isAuthenticated: false,
						isLoading: false,
						error: null,
					});

					// Redirect to login if required
					if (requireAuth) {
						authClient.redirectToLogin();
					}
				}
			} catch (error) {
				setState({
					user: null,
					isAuthenticated: false,
					isLoading: false,
					error: (error as Error).message,
				});
			}
		};

		initAuth();
	}, [authClient, requireAuth]);

	// Set up token refresh interval
	useEffect(() => {
		if (!state.isAuthenticated) return;

		const interval = setInterval(async () => {
			if (authClient.needsRefresh()) {
				try {
					await authClient.refreshToken();
					const user = authClient.getCurrentUser();
					setState((prev) => ({ ...prev, user }));
				} catch {
					// Token refresh failed, will be handled by onSessionExpired
				}
			}
		}, 60000); // Check every minute

		return () => clearInterval(interval);
	}, [state.isAuthenticated, authClient]);

	const login = useCallback(
		async (credentials: LoginRequest) => {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const user = await authClient.login(credentials);
				setState({
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null,
				});
			} catch (error) {
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: (error as Error).message,
				}));
				throw error;
			}
		},
		[authClient]
	);

	const register = useCallback(
		async (data: RegisterRequest) => {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const user = await authClient.register(data);
				setState({
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null,
				});
			} catch (error) {
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: (error as Error).message,
				}));
				throw error;
			}
		},
		[authClient]
	);

	const logout = useCallback(async () => {
		await authClient.logout();
		setState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,
		});
	}, [authClient]);

	const refreshSession = useCallback(async () => {
		try {
			await authClient.refreshToken();
			const user = authClient.getCurrentUser();
			setState((prev) => ({ ...prev, user }));
		} catch (error) {
			setState({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: (error as Error).message,
			});
		}
	}, [authClient]);

	const resetPassword = useCallback(
		async (email: string) => {
			await authClient.requestPasswordReset(email);
		},
		[authClient]
	);

	const confirmPasswordReset = useCallback(
		async (token: string, newPassword: string) => {
			await authClient.confirmPasswordReset(token, newPassword);
		},
		[authClient]
	);

	const hasRole = useCallback(
		(role: UserRole): boolean => {
			return state.user?.roles.includes(role) ?? false;
		},
		[state.user]
	);

	const hasAnyRole = useCallback(
		(roles: UserRole[]): boolean => {
			return roles.some((role) => state.user?.roles.includes(role));
		},
		[state.user]
	);

	const hasAllRoles = useCallback(
		(roles: UserRole[]): boolean => {
			return roles.every((role) => state.user?.roles.includes(role));
		},
		[state.user]
	);

	const contextValue: AuthContextValue = useMemo(
		() => ({
			...state,
			login,
			register,
			logout,
			refreshSession,
			resetPassword,
			confirmPasswordReset,
			hasRole,
			hasAnyRole,
			hasAllRoles,
		}),
		[
			state,
			login,
			register,
			logout,
			refreshSession,
			resetPassword,
			confirmPasswordReset,
			hasRole,
			hasAnyRole,
			hasAllRoles,
		]
	);

	// Show loading while checking auth
	if (state.isLoading && loadingComponent) {
		return <>{loadingComponent}</>;
	}

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
}

/**
 * Hook to access authentication state and methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, logout, hasRole } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginButton />;
 *   }
 *   
 *   return (
 *     <div>
 *       Welcome, {user?.firstName}!
 *       {hasRole('ADMIN') && <AdminPanel />}
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
}

/**
 * Hook to get the current authenticated user
 * Throws if not authenticated (use with requireAuth provider)
 */
export function useUser(): AuthUser {
	const { user, isAuthenticated } = useAuth();

	if (!isAuthenticated || !user) {
		throw new Error('User is not authenticated');
	}

	return user;
}

/**
 * Hook to check if user has specific role(s)
 * 
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const isAdmin = useHasRole('ADMIN');
 *   const canDispatch = useHasRole(['ADMIN', 'DISPATCHER']);
 *   
 *   if (!canDispatch) return null;
 *   return <DispatchControls />;
 * }
 * ```
 */
export function useHasRole(role: UserRole | UserRole[]): boolean {
	const { hasRole, hasAnyRole } = useAuth();

	if (Array.isArray(role)) {
		return hasAnyRole(role);
	}

	return hasRole(role);
}

export { AuthContext };
