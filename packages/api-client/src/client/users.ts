import { get, post, put } from './base';
import type {
	User,
	CreateUserRequest,
	UpdateUserRequest,
	UpdateStatusRequest,
	UserQueryParams,
} from '../types';

// Full path including service context path (/api/user-management) + endpoint path (/api/users)
const BASE_PATH = '/api/user-management/api/users';

/**
 * Get a list of users with optional filtering
 */
export async function getUsers(params?: UserQueryParams): Promise<User[]> {
	return get<User[]>(BASE_PATH, { params: params as Record<string, string | number | boolean | undefined> });
}

/**
 * Get a single user by internal UUID
 */
export async function getUserById(id: string): Promise<User> {
	return get<User>(`${BASE_PATH}/${id}`);
}

/**
 * Get a user by prefixed user ID (USR-XXXXXXXX)
 */
export async function getUserByUserId(userId: string): Promise<User> {
	return get<User>(`${BASE_PATH}/by-user-id/${userId}`);
}

/**
 * Get a user by their auth ID (Supabase ID)
 */
export async function getUserByAuthId(authId: string): Promise<User> {
	return get<User>(`${BASE_PATH}/auth/${authId}`);
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
	return post<User, CreateUserRequest>(BASE_PATH, data);
}

/**
 * Update a user's profile
 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<User> {
	return put<User, UpdateUserRequest>(`${BASE_PATH}/${id}`, data);
}

/**
 * Update a user's account status
 * Status transitions are validated by the backend
 */
export async function updateUserStatus(id: string, data: UpdateStatusRequest): Promise<User> {
	return put<User, UpdateStatusRequest>(`${BASE_PATH}/${id}/status`, data);
}
