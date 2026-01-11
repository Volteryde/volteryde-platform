package com.volteryde.usermanagement.dto;

import com.volteryde.usermanagement.model.AccountStatus;
import com.volteryde.usermanagement.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTOs for User management operations.
 * All validation is enforced at the backend level.
 */
public class UserDto {

	/**
	 * Request DTO for creating a new user.
	 * All required fields must be validated by backend.
	 */
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CreateUserRequest {

		@NotBlank(message = "Email is required")
		@Email(message = "Email must be valid")
		private String email;

		private String authId;

		@NotBlank(message = "First name is required")
		@Size(max = 50, message = "First name must not exceed 50 characters")
		private String firstName;

		@NotBlank(message = "Last name is required")
		@Size(max = 50, message = "Last name must not exceed 50 characters")
		private String lastName;

		@Size(max = 20, message = "Phone number must not exceed 20 characters")
		private String phoneNumber;

		@NotNull(message = "Role is required")
		private UserRole role;

		private String createdBy; // User ID of creator (for audit)
	}

	/**
	 * Request DTO for updating user profile.
	 * Only specified fields will be updated.
	 */
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class UpdateProfileRequest {

		@Size(max = 50, message = "First name must not exceed 50 characters")
		private String firstName;

		@Size(max = 50, message = "Last name must not exceed 50 characters")
		private String lastName;

		@Size(max = 20, message = "Phone number must not exceed 20 characters")
		private String phoneNumber;

		private String profilePictureUrl;

		private String updatedBy; // User ID of updater (for audit)
	}

	/**
	 * Request DTO for updating user status.
	 * Status changes are validated against allowed transitions.
	 */
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class UpdateStatusRequest {

		@NotNull(message = "Status is required")
		private AccountStatus status;

		private String updatedBy; // User ID of updater (for audit)

		private String reason; // Reason for status change (for logging)
	}

	/**
	 * Response DTO for user data.
	 * Contains all user information safe for API response.
	 */
	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class UserResponse {
		private UUID id; // Internal database ID
		private String userId; // Prefixed public ID (USR-XXXXXXXX)
		private String email;
		private String firstName;
		private String lastName;
		private String phoneNumber;
		private String profilePictureUrl;
		private UserRole role;
		private AccountStatus status;
		private LocalDateTime createdAt;
		private LocalDateTime updatedAt;
		private String createdBy;
		private String updatedBy;

		// Role-specific profile details
		private DriverProfileResponse driverProfile;
		private FleetManagerProfileResponse fleetManagerProfile;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class DriverProfileResponse {
		private UUID id;
		private String licenseNumber;
		private int yearsOfExperience;
		private String vehicleAssignedId;
		private String status;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class FleetManagerProfileResponse {
		private UUID id;
		private String assignedRegion;
		private String hubId;
	}
}
