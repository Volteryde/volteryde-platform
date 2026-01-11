package com.volteryde.usermanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User entity representing a user in the Volteryde platform.
 * 
 * Key features:
 * - Prefixed user ID (USR-XXXXXXXX) for identification
 * - Internal UUID for database relations
 * - Account status with defined transitions
 * - Audit fields for traceability
 */
@Entity
@Table(name = "users", indexes = {
		@Index(name = "idx_users_email", columnList = "email"),
		@Index(name = "idx_users_user_id", columnList = "user_id"),
		@Index(name = "idx_users_auth_id", columnList = "auth_id"),
		@Index(name = "idx_users_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

	/**
	 * Internal database ID (UUID) - used for foreign key relations
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	/**
	 * Public user ID with prefix (USR-XXXXXXXX)
	 * Immutable after creation, used for external identification
	 */
	@Column(name = "user_id", nullable = false, unique = true, updatable = false, length = 20)
	private String userId;

	/**
	 * User email address - unique identifier for authentication
	 */
	@NotBlank(message = "Email is required")
	@Email(message = "Email must be valid")
	@Column(nullable = false, unique = true)
	private String email;

	/**
	 * ID from Auth Service / Identity Provider (e.g., Supabase)
	 * Links user to authentication system
	 */
	@Column(name = "auth_id", unique = true)
	private String authId;

	/**
	 * User's first name
	 */
	@NotBlank(message = "First name is required")
	@Size(max = 50, message = "First name must not exceed 50 characters")
	@Column(name = "first_name", nullable = false, length = 50)
	private String firstName;

	/**
	 * User's last name
	 */
	@NotBlank(message = "Last name is required")
	@Size(max = 50, message = "Last name must not exceed 50 characters")
	@Column(name = "last_name", nullable = false, length = 50)
	private String lastName;

	/**
	 * User's phone number
	 */
	@Size(max = 20, message = "Phone number must not exceed 20 characters")
	@Column(name = "phone_number", length = 20)
	private String phoneNumber;

	/**
	 * URL to user's profile picture
	 */
	@Column(name = "profile_picture_url", length = 500)
	private String profilePictureUrl;

	/**
	 * User role - determines permissions and access level
	 */
	@NotNull(message = "Role is required")
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private UserRole role;

	/**
	 * Account status - managed exclusively by backend
	 * Valid values: PENDING, ACTIVE, INACTIVE, SUSPENDED
	 */
	@NotNull(message = "Account status is required")
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	@Builder.Default
	private AccountStatus status = AccountStatus.PENDING;

	/**
	 * Timestamp when user was created - immutable, server-generated
	 */
	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	/**
	 * Timestamp when user was last updated - server-generated
	 */
	@UpdateTimestamp
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	/**
	 * User ID of who created this user (for audit trail)
	 */
	@Column(name = "created_by", length = 20)
	private String createdBy;

	/**
	 * User ID of who last updated this user (for audit trail)
	 */
	@Column(name = "updated_by", length = 20)
	private String updatedBy;

	/**
	 * Generate prefixed user ID before persisting
	 */
	@PrePersist
	public void prePersist() {
		if (this.userId == null) {
			this.userId = UserIdGenerator.generate(this.role);
		}
		if (this.status == null) {
			this.status = AccountStatus.PENDING;
		}
	}
}
