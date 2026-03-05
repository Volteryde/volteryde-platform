/**
 * Auth-service types for API client.
 * These types mirror the auth-service DTOs.
 */

/**
 * Auth user profile returned by GET /api/auth/me
 */
export interface AuthProfile {
	/** Internal auth UUID */
	id: string;
	/** Prefixed access ID (VR-A######) */
	accessId: string;
	/** Email address */
	email: string;
	/** First name */
	firstName: string;
	/** Last name */
	lastName: string;
	/** Phone number */
	phoneNumber?: string;
	/** Avatar / profile picture URL */
	avatarUrl?: string;
	/** Organization ID */
	organizationId?: string;
	/** Assigned roles */
	roles: string[];
	/** Whether email is verified */
	emailVerified: boolean;
}

/**
 * Login request
 */
export interface LoginRequest {
	email: string;
	password: string;
}

/**
 * Auth response after login / token refresh
 */
export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: AuthProfile;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
	refreshToken: string;
}

/**
 * Update password request
 */
export interface UpdatePasswordRequest {
	currentPassword: string;
	newPassword: string;
}
