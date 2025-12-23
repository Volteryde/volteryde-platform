// ============================================================================
// Volteryde Auth SDK - Type Definitions
// ============================================================================

/**
 * User roles supported by the Volteryde platform
 */
export type UserRole =
	| 'SUPER_ADMIN'
	| 'ADMIN'
	| 'DISPATCHER'
	| 'SUPPORT_AGENT'
	| 'PARTNER'
	| 'DRIVER'
	| 'FLEET_MANAGER';

/**
 * User information embedded in JWT token
 */
export interface AuthUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	roles: UserRole[];
	permissions?: string[];
	avatarUrl?: string;
	organizationId?: string;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
	sub: string; // User ID
	email: string;
	firstName: string;
	lastName: string;
	roles: UserRole[];
	permissions?: string[];
	organizationId?: string;
	iat: number; // Issued at
	exp: number; // Expiration
	iss: string; // Issuer (auth.volteryde.org)
	aud: string; // Audience (app identifier)
}

/**
 * Authentication tokens returned after login
 */
export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresIn: number; // Seconds until access token expires
	tokenType: 'Bearer';
}

/**
 * Login request payload
 */
export interface LoginRequest {
	email: string;
	password: string;
	rememberMe?: boolean;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phoneNumber?: string;
	organizationId?: string;
	inviteCode?: string;
}

/**
 * Password reset request payload
 */
export interface PasswordResetRequest {
	email: string;
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetConfirmRequest {
	token: string;
	newPassword: string;
}

/**
 * Authentication state for React context
 */
export interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

/**
 * Auth context actions
 */
export interface AuthContextValue extends AuthState {
	login: (credentials: LoginRequest) => Promise<void>;
	register: (data: RegisterRequest) => Promise<void>;
	logout: () => Promise<void>;
	refreshSession: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
	hasRole: (role: UserRole) => boolean;
	hasAnyRole: (roles: UserRole[]) => boolean;
	hasAllRoles: (roles: UserRole[]) => boolean;
}

/**
 * Auth SDK configuration options
 */
export interface AuthConfig {
	/** Base URL for the auth service (e.g., https://auth.volteryde.org) */
	authServiceUrl: string;
	/** Application identifier for audience claim */
	appId: string;
	/** Storage key prefix for tokens */
	storagePrefix?: string;
	/** Use secure cookies instead of localStorage (recommended for production) */
	useSecureCookies?: boolean;
	/** Token refresh threshold in seconds (refresh before expiry) */
	refreshThreshold?: number;
	/** Callback when session expires */
	onSessionExpired?: () => void;
	/** Callback when auth error occurs */
	onAuthError?: (error: Error) => void;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
}
