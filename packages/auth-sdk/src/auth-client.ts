// ============================================================================
// Volteryde Auth SDK - API Client
// ============================================================================

import type {
	AuthConfig,
	AuthTokens,
	AuthUser,
	LoginRequest,
	RegisterRequest,
	ApiResponse,
	TokenPayload,
} from './types';
import { TokenStorage } from './token-storage';
import { decodeJwt } from 'jose';

/**
 * Auth API client for communicating with the centralized auth service
 */
export class AuthClient {
	private config: Required<AuthConfig>;
	private tokenStorage: TokenStorage;
	private refreshPromise: Promise<AuthTokens> | null = null;

	constructor(config: AuthConfig) {
		this.config = {
			authServiceUrl: config.authServiceUrl,
			appId: config.appId,
			storagePrefix: config.storagePrefix ?? 'volteryde_auth_',
			useSecureCookies: config.useSecureCookies ?? false,
			refreshThreshold: config.refreshThreshold ?? 300, // 5 minutes
			onSessionExpired: config.onSessionExpired ?? (() => { }),
			onAuthError: config.onAuthError ?? (() => { }),
		};

		this.tokenStorage = new TokenStorage(
			this.config.storagePrefix,
			this.config.useSecureCookies
		);
	}

	/**
	 * Get the auth service login URL for SSO redirect
	 */
	getLoginUrl(returnUrl?: string): string {
		const params = new URLSearchParams({
			app: this.config.appId,
			redirect: returnUrl ?? window.location.href,
		});
		return `${this.config.authServiceUrl}/login?${params.toString()}`;
	}

	/**
	 * Get the auth service register URL for SSO redirect
	 */
	getRegisterUrl(returnUrl?: string): string {
		const params = new URLSearchParams({
			app: this.config.appId,
			redirect: returnUrl ?? window.location.href,
		});
		return `${this.config.authServiceUrl}/register?${params.toString()}`;
	}

	/**
	 * Redirect to login page
	 */
	redirectToLogin(returnUrl?: string): void {
		window.location.href = this.getLoginUrl(returnUrl);
	}

	/**
	 * Redirect to register page
	 */
	redirectToRegister(returnUrl?: string): void {
		window.location.href = this.getRegisterUrl(returnUrl);
	}

	/**
	 * Authenticate user with email and password
	 */
	async login(credentials: LoginRequest): Promise<AuthUser> {
		const response = await this.request<AuthTokens>('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify(credentials),
		});

		if (!response.success || !response.data) {
			throw new Error(response.error?.message ?? 'Login failed');
		}

		this.tokenStorage.setTokens(response.data);
		return this.parseUserFromToken(response.data.accessToken);
	}

	/**
	 * Register a new user
	 */
	async register(data: RegisterRequest): Promise<AuthUser> {
		const response = await this.request<AuthTokens>('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify(data),
		});

		if (!response.success || !response.data) {
			throw new Error(response.error?.message ?? 'Registration failed');
		}

		this.tokenStorage.setTokens(response.data);
		return this.parseUserFromToken(response.data.accessToken);
	}

	/**
	 * Logout user and clear tokens
	 */
	async logout(): Promise<void> {
		try {
			await this.request('/api/auth/logout', {
				method: 'POST',
			});
		} catch {
			// Ignore logout errors, clear tokens anyway
		} finally {
			this.tokenStorage.clearTokens();
		}
	}

	/**
	 * Refresh the access token
	 */
	async refreshToken(): Promise<AuthTokens> {
		// Prevent concurrent refresh requests
		if (this.refreshPromise) {
			return this.refreshPromise;
		}

		const refreshToken = this.tokenStorage.getRefreshToken();
		if (!refreshToken && !this.config.useSecureCookies) {
			this.config.onSessionExpired();
			throw new Error('No refresh token available');
		}

		this.refreshPromise = this.performRefresh(refreshToken);

		try {
			const tokens = await this.refreshPromise;
			return tokens;
		} finally {
			this.refreshPromise = null;
		}
	}

	private async performRefresh(refreshToken: string | null): Promise<AuthTokens> {
		const response = await this.request<AuthTokens>('/api/auth/refresh', {
			method: 'POST',
			body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
		});

		if (!response.success || !response.data) {
			this.tokenStorage.clearTokens();
			this.config.onSessionExpired();
			throw new Error(response.error?.message ?? 'Token refresh failed');
		}

		this.tokenStorage.setTokens(response.data);
		return response.data;
	}

	/**
	 * Get current user from stored token
	 */
	getCurrentUser(): AuthUser | null {
		const accessToken = this.tokenStorage.getAccessToken();
		if (!accessToken) return null;

		try {
			return this.parseUserFromToken(accessToken);
		} catch {
			return null;
		}
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return this.tokenStorage.hasValidTokens();
	}

	/**
	 * Check if token needs refresh
	 */
	needsRefresh(): boolean {
		return this.tokenStorage.isTokenExpiringSoon(this.config.refreshThreshold);
	}

	/**
	 * Get authorization header for API requests
	 */
	getAuthHeader(): string | null {
		const token = this.tokenStorage.getAccessToken();
		return token ? `Bearer ${token}` : null;
	}

	/**
	 * Request password reset
	 */
	async requestPasswordReset(email: string): Promise<void> {
		const response = await this.request('/api/auth/password/reset', {
			method: 'POST',
			body: JSON.stringify({ email }),
		});

		if (!response.success) {
			throw new Error(response.error?.message ?? 'Password reset request failed');
		}
	}

	/**
	 * Confirm password reset with token
	 */
	async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
		const response = await this.request('/api/auth/password/reset/confirm', {
			method: 'POST',
			body: JSON.stringify({ token, newPassword }),
		});

		if (!response.success) {
			throw new Error(response.error?.message ?? 'Password reset confirmation failed');
		}
	}

	/**
	 * Handle OAuth callback (for SSO flow)
	 */
	async handleAuthCallback(code: string): Promise<AuthUser> {
		const response = await this.request<AuthTokens>('/api/auth/callback', {
			method: 'POST',
			body: JSON.stringify({ code, appId: this.config.appId }),
		});

		if (!response.success || !response.data) {
			throw new Error(response.error?.message ?? 'Authentication callback failed');
		}

		this.tokenStorage.setTokens(response.data);
		return this.parseUserFromToken(response.data.accessToken);
	}

	private parseUserFromToken(accessToken: string): AuthUser {
		const payload = decodeJwt(accessToken) as unknown as TokenPayload;

		return {
			id: payload.sub,
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
			roles: payload.roles,
			permissions: payload.permissions,
			organizationId: payload.organizationId,
		};
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		const url = `${this.config.authServiceUrl}${endpoint}`;

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...options.headers,
		};

		// Add auth header if we have a token
		const authHeader = this.getAuthHeader();
		if (authHeader) {
			(headers as Record<string, string>)['Authorization'] = authHeader;
		}

		try {
			const response = await fetch(url, {
				...options,
				headers,
				credentials: this.config.useSecureCookies ? 'include' : 'same-origin',
			});

			const data = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: {
						code: data.code ?? 'UNKNOWN_ERROR',
						message: data.message ?? 'An error occurred',
						details: data.details,
					},
				};
			}

			return {
				success: true,
				data: data as T,
			};
		} catch (error) {
			this.config.onAuthError(error as Error);
			return {
				success: false,
				error: {
					code: 'NETWORK_ERROR',
					message: (error as Error).message ?? 'Network error occurred',
				},
			};
		}
	}
}
