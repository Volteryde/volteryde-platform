/**
 * User-related types for API client.
 * These types mirror the backend DTOs and enums.
 */

/**
 * User roles - validated by backend.
 */
export type UserRole =
	| 'CLIENT'
	| 'DRIVER'
	| 'FLEET_MANAGER'
	| 'DISPATCHER'
	| 'PARTNER'
	| 'CUSTOMER_SUPPORT'
	| 'SYSTEM_SUPPORT'
	| 'ADMIN'
	| 'SUPER_ADMIN';

/**
 * Account status - managed exclusively by backend.
 * Valid transitions:
 * - PENDING → ACTIVE (after verification)
 * - ACTIVE → INACTIVE (deactivation)
 * - ACTIVE → SUSPENDED (admin action)
 * - INACTIVE → ACTIVE (reactivation)
 * - SUSPENDED → ACTIVE (reinstatement)
 */
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/**
 * User entity from backend.
 */
export interface User {
	/** Internal database UUID */
	id: string;
	/** Prefixed public user ID (USR-XXXXXXXX) */
	userId: string;
	/** User email address */
	email: string;
	/** First name */
	firstName: string;
	/** Last name */
	lastName: string;
	/** Phone number (optional) */
	phoneNumber?: string;
	/** Profile picture URL (optional) */
	profilePictureUrl?: string;
	/** User role */
	role: UserRole;
	/** Account status */
	status: AccountStatus;
	/** Creation timestamp (ISO string) */
	createdAt: string;
	/** Last update timestamp (ISO string) */
	updatedAt?: string;
	/** User ID of creator (for audit) */
	createdBy?: string;
	/** User ID of last updater (for audit) */
	/** User ID of last updater (for audit) */
	updatedBy?: string;

	/** Driver specific profile */
	driverProfile?: DriverProfile;
	/** Fleet Manager specific profile */
	fleetManagerProfile?: FleetManagerProfile;
}

export interface DriverProfile {
	id: string;
	licenseNumber: string;
	yearsOfExperience: number;
	vehicleAssignedId: string;
	status: string;
}

export interface FleetManagerProfile {
	id: string;
	assignedRegion: string;
	hubId: string;
}

/**
 * Request to create a new user.
 */
export interface CreateUserRequest {
	email: string;
	authId?: string;
	firstName: string;
	lastName: string;
	phoneNumber?: string;
	role: UserRole;
	createdBy?: string;
}

/**
 * Request to update user profile.
 */
export interface UpdateUserRequest {
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
	profilePictureUrl?: string;
	updatedBy?: string;
}

/**
 * Request to update user account status.
 */
export interface UpdateStatusRequest {
	status: AccountStatus;
	updatedBy?: string;
	reason?: string;
}

/**
 * Paginated response for user listings.
 */
export interface UsersResponse {
	users: User[];
	total: number;
	page: number;
	pageSize: number;
}

/**
 * User query parameters for filtering.
 */
export interface UserQueryParams {
	role?: UserRole;
	status?: AccountStatus;
	page?: number;
	pageSize?: number;
	search?: string;
}
