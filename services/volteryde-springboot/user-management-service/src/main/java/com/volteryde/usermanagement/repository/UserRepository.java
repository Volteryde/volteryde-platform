package com.volteryde.usermanagement.repository;

import com.volteryde.usermanagement.model.AccountStatus;
import com.volteryde.usermanagement.model.User;
import com.volteryde.usermanagement.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

	/**
	 * Find user by email address.
	 */
	Optional<User> findByEmail(String email);

	/**
	 * Find user by auth provider ID.
	 */
	Optional<User> findByAuthId(String authId);

	/**
	 * Find user by prefixed user ID (USR-XXXXXXXX).
	 */
	Optional<User> findByUserId(String userId);

	/**
	 * Check if email already exists.
	 */
	boolean existsByEmail(String email);

	/**
	 * Check if prefixed user ID already exists.
	 */
	boolean existsByUserId(String userId);

	/**
	 * Find all users by role.
	 */
	List<User> findByRole(UserRole role);

	/**
	 * Find all users by account status.
	 */
	List<User> findByStatus(AccountStatus status);

	/**
	 * Find all users by role and status.
	 */
	List<User> findByRoleAndStatus(UserRole role, AccountStatus status);
}
