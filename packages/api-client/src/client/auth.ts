import { get, post, put } from './base';
import type {
	AuthProfile,
	LoginRequest,
	AuthResponse,
	RefreshTokenRequest,
	UpdatePasswordRequest,
} from '../types';

// Auth service context path
const BASE_PATH = '/api/auth';

/**
 * Get the current authenticated user's profile.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function getProfile(): Promise<AuthProfile> {
	return get<AuthProfile>(`${BASE_PATH}/me`);
}

/**
 * Login with email and password.
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
	return post<AuthResponse, LoginRequest>(`${BASE_PATH}/login`, data);
}

/**
 * Refresh the access token using a refresh token.
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
	return post<AuthResponse, RefreshTokenRequest>(`${BASE_PATH}/refresh`, data);
}

/**
 * Change the current user's password.
 */
export async function updatePassword(data: UpdatePasswordRequest): Promise<void> {
	return put<void, UpdatePasswordRequest>(`${BASE_PATH}/password`, data);
}

/**
 * Logout — revoke the current refresh token.
 */
export async function logout(refreshTokenValue: string): Promise<void> {
	return post<void, { refreshToken: string }>(`${BASE_PATH}/logout`, {
		refreshToken: refreshTokenValue,
	});
}
