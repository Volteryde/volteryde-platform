// ============================================================================
// Volteryde Auth SDK - Token Storage
// ============================================================================

import type { AuthTokens } from './types';

const DEFAULT_PREFIX = 'volteryde_auth_';

/**
 * Secure token storage abstraction
 * Handles both localStorage and cookie-based storage
 */
export class TokenStorage {
	private prefix: string;
	private useSecureCookies: boolean;

	constructor(prefix: string = DEFAULT_PREFIX, useSecureCookies: boolean = false) {
		this.prefix = prefix;
		this.useSecureCookies = useSecureCookies;
	}

	/**
	 * Store authentication tokens
	 */
	setTokens(tokens: AuthTokens): void {
		if (this.useSecureCookies) {
			// For secure cookies, we rely on httpOnly cookies set by the server
			// Only store non-sensitive metadata in localStorage
			this.setItem('token_type', tokens.tokenType);
			this.setItem('expires_at', String(Date.now() + tokens.expiresIn * 1000));
		} else {
			this.setItem('access_token', tokens.accessToken);
			this.setItem('refresh_token', tokens.refreshToken);
			this.setItem('token_type', tokens.tokenType);
			this.setItem('expires_at', String(Date.now() + tokens.expiresIn * 1000));
		}
	}

	/**
	 * Get access token
	 */
	getAccessToken(): string | null {
		if (this.useSecureCookies) {
			// When using secure cookies, access token is sent automatically
			// Return null to indicate cookie-based auth
			return null;
		}
		return this.getItem('access_token');
	}

	/**
	 * Get refresh token
	 */
	getRefreshToken(): string | null {
		if (this.useSecureCookies) {
			return null;
		}
		return this.getItem('refresh_token');
	}

	/**
	 * Check if tokens exist and are not expired
	 */
	hasValidTokens(): boolean {
		const expiresAt = this.getItem('expires_at');
		if (!expiresAt) return false;

		const expirationTime = parseInt(expiresAt, 10);
		return Date.now() < expirationTime;
	}

	/**
	 * Check if token is about to expire (within threshold)
	 */
	isTokenExpiringSoon(thresholdSeconds: number = 300): boolean {
		const expiresAt = this.getItem('expires_at');
		if (!expiresAt) return true;

		const expirationTime = parseInt(expiresAt, 10);
		const threshold = thresholdSeconds * 1000;
		return Date.now() > expirationTime - threshold;
	}

	/**
	 * Clear all stored tokens
	 */
	clearTokens(): void {
		this.removeItem('access_token');
		this.removeItem('refresh_token');
		this.removeItem('token_type');
		this.removeItem('expires_at');

		if (this.useSecureCookies) {
			// Clear cookies by setting expired date
			document.cookie = `${this.prefix}access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
			document.cookie = `${this.prefix}refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
		}
	}

	private setItem(key: string, value: string): void {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.setItem(`${this.prefix}${key}`, value);
		}
	}

	private getItem(key: string): string | null {
		if (typeof window !== 'undefined' && window.localStorage) {
			return localStorage.getItem(`${this.prefix}${key}`);
		}
		return null;
	}

	private removeItem(key: string): void {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.removeItem(`${this.prefix}${key}`);
		}
	}
}
