package com.volteryde.usermanagement.service;

import com.volteryde.usermanagement.dto.UserDto;
import com.volteryde.usermanagement.model.AccountStatus;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for user management operations.
 * All validation is enforced at the service layer.
 */
public interface UserService {

	/**
	 * Create a new user with the provided details.
	 * Generates a prefixed user ID automatically.
	 *
	 * @param request User creation request with validated data
	 * @return Created user response
	 */
	UserDto.UserResponse createUser(UserDto.CreateUserRequest request);

	/**
	 * Get user profile by internal UUID.
	 *
	 * @param userId Internal database UUID
	 * @return User response
	 */
	UserDto.UserResponse getUserProfile(UUID userId);

	/**
	 * Get user profile by auth provider ID.
	 *
	 * @param authId Auth ID from identity provider
	 * @return User response
	 */
	UserDto.UserResponse getUserByAuthId(String authId);

	/**
	 * Get user by prefixed user ID (USR-XXXXXXXX).
	 *
	 * @param userId Prefixed user ID
	 * @return User response
	 */
	UserDto.UserResponse getUserByUserId(String userId);

	/**
	 * Update user profile information.
	 *
	 * @param userId  Internal database UUID
	 * @param request Profile update request
	 * @return Updated user response
	 */
	UserDto.UserResponse updateUserProfile(UUID userId, UserDto.UpdateProfileRequest request);

	/**
	 * Update user account status.
	 * Validates status transitions according to business rules.
	 *
	 * @param userId  Internal database UUID
	 * @param request Status update request
	 * @return Updated user response
	 * @throws IllegalStateException if status transition is not allowed
	 */
	UserDto.UserResponse updateUserStatus(UUID userId, UserDto.UpdateStatusRequest request);

	/**
	 * Get all users.
	 * 
	 * @param role Optional role filter
	 * @return List of all users
	 */
	List<UserDto.UserResponse> getAllUsers(com.volteryde.usermanagement.model.UserRole role);

	/**
	 * Validate if a status transition is allowed.
	 *
	 * @param currentStatus Current account status
	 * @param newStatus     Requested new status
	 * @return true if transition is allowed
	 */
	boolean isValidStatusTransition(AccountStatus currentStatus, AccountStatus newStatus);
}
