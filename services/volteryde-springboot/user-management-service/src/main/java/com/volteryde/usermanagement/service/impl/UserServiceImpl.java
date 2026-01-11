package com.volteryde.usermanagement.service.impl;

import com.volteryde.usermanagement.dto.UserDto;
import com.volteryde.usermanagement.model.AccountStatus;
import com.volteryde.usermanagement.model.User;
import com.volteryde.usermanagement.model.UserRole;
import com.volteryde.usermanagement.repository.UserRepository;
import com.volteryde.usermanagement.service.ActivityLogService;
import com.volteryde.usermanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Implementation of UserService with robust validation and audit support.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final ActivityLogService activityLogService;
	private final com.volteryde.usermanagement.repository.DriverProfileRepository driverProfileRepository;
	private final com.volteryde.usermanagement.repository.FleetManagerProfileRepository fleetManagerProfileRepository;

	// Valid status transitions - key is current status, value is set of allowed new
	// statuses
	private static final java.util.Map<AccountStatus, Set<AccountStatus>> ALLOWED_TRANSITIONS = java.util.Map.of(
			AccountStatus.PENDING, Set.of(AccountStatus.ACTIVE, AccountStatus.INACTIVE),
			AccountStatus.ACTIVE, Set.of(AccountStatus.INACTIVE, AccountStatus.SUSPENDED),
			AccountStatus.INACTIVE, Set.of(AccountStatus.ACTIVE),
			AccountStatus.SUSPENDED, Set.of(AccountStatus.ACTIVE));

	@Override
	@Transactional
	@SuppressWarnings("null")
	public UserDto.UserResponse createUser(UserDto.CreateUserRequest request) {
		log.info("Creating user with email: {}", request.getEmail());

		// Validate email uniqueness
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new IllegalArgumentException("User with email already exists");
		}

		// Validate role is a valid enum value (backend enforcement)
		if (request.getRole() == null) {
			throw new IllegalArgumentException("Role is required");
		}
		validateRole(request.getRole());

		User user = User.builder()
				.email(request.getEmail())
				.authId(request.getAuthId())
				.firstName(request.getFirstName())
				.lastName(request.getLastName())
				.phoneNumber(request.getPhoneNumber())
				.role(request.getRole())
				.status(AccountStatus.PENDING) // New users start as PENDING
				.createdBy(request.getCreatedBy())
				.build();

		User savedUser = userRepository.save(user);

		activityLogService.logActivity(
				savedUser.getId(),
				"CREATE_USER",
				"USER",
				savedUser.getId(),
				"User registered: " + savedUser.getEmail() + " with ID: " + savedUser.getUserId(),
				"127.0.0.1");

		log.info("User created successfully with ID: {}", savedUser.getUserId());
		return mapToResponse(savedUser);
	}

	@Override
	public UserDto.UserResponse getUserProfile(UUID userId) {
		if (userId == null) {
			throw new IllegalArgumentException("User ID cannot be null");
		}
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));
		return mapToResponse(user);
	}

	@Override
	public UserDto.UserResponse getUserByAuthId(String authId) {
		User user = userRepository.findByAuthId(authId)
				.orElseThrow(() -> new IllegalArgumentException("User not found for auth ID: " + authId));
		return mapToResponse(user);
	}

	@Override
	public UserDto.UserResponse getUserByUserId(String userId) {
		User user = userRepository.findByUserId(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found for user ID: " + userId));
		return mapToResponse(user);
	}

	@Override
	@Transactional
	@SuppressWarnings("null")
	public UserDto.UserResponse updateUserProfile(UUID userId, UserDto.UpdateProfileRequest request) {
		if (userId == null) {
			throw new IllegalArgumentException("User ID cannot be null");
		}
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (request.getFirstName() != null) {
			user.setFirstName(request.getFirstName());
		}
		if (request.getLastName() != null) {
			user.setLastName(request.getLastName());
		}
		if (request.getPhoneNumber() != null) {
			user.setPhoneNumber(request.getPhoneNumber());
		}
		if (request.getProfilePictureUrl() != null) {
			user.setProfilePictureUrl(request.getProfilePictureUrl());
		}
		if (request.getUpdatedBy() != null) {
			user.setUpdatedBy(request.getUpdatedBy());
		}

		User updatedUser = userRepository.save(user);

		activityLogService.logActivity(
				userId,
				"UPDATE_PROFILE",
				"USER",
				userId,
				"User updated profile",
				"127.0.0.1");

		return mapToResponse(updatedUser);
	}

	@Override
	@Transactional
	public UserDto.UserResponse updateUserStatus(UUID userId, UserDto.UpdateStatusRequest request) {
		if (userId == null) {
			throw new IllegalArgumentException("User ID cannot be null");
		}
		if (request.getStatus() == null) {
			throw new IllegalArgumentException("Status is required");
		}

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		AccountStatus currentStatus = user.getStatus();
		AccountStatus newStatus = request.getStatus();

		// Validate status transition
		if (!isValidStatusTransition(currentStatus, newStatus)) {
			throw new IllegalStateException(
					String.format("Invalid status transition from %s to %s", currentStatus, newStatus));
		}

		user.setStatus(newStatus);
		if (request.getUpdatedBy() != null) {
			user.setUpdatedBy(request.getUpdatedBy());
		}

		User updatedUser = userRepository.save(user);

		String reason = request.getReason() != null ? request.getReason() : "No reason provided";
		activityLogService.logActivity(
				userId,
				"UPDATE_STATUS",
				"USER",
				userId,
				String.format("Status changed from %s to %s. Reason: %s", currentStatus, newStatus, reason),
				"127.0.0.1");

		log.info("User {} status changed from {} to {}", user.getUserId(), currentStatus, newStatus);
		return mapToResponse(updatedUser);
	}

	@Override
	public List<UserDto.UserResponse> getAllUsers(UserRole role) {
		log.info("Fetching all users with role filter: {}", role);
		List<User> users;
		if (role != null) {
			users = userRepository.findByRole(role);
		} else {
			users = userRepository.findAll();
		}
		return users.stream()
				.map(this::mapToResponse)
				.toList();
	}

	@Override
	public boolean isValidStatusTransition(AccountStatus currentStatus, AccountStatus newStatus) {
		if (currentStatus == newStatus) {
			return true; // Same status is always valid (no-op)
		}
		Set<AccountStatus> allowedTransitions = ALLOWED_TRANSITIONS.get(currentStatus);
		return allowedTransitions != null && allowedTransitions.contains(newStatus);
	}

	/**
	 * Validate that the role is a valid enum value.
	 * This provides backend enforcement of role values.
	 */
	private void validateRole(UserRole role) {
		try {
			UserRole.valueOf(role.name());
		} catch (Exception e) {
			throw new IllegalArgumentException("Invalid role: " + role);
		}
	}

	private UserDto.UserResponse mapToResponse(User user) {
		UserDto.UserResponse.UserResponseBuilder responseBuilder = UserDto.UserResponse.builder()
				.id(user.getId())
				.userId(user.getUserId())
				.email(user.getEmail())
				.firstName(user.getFirstName())
				.lastName(user.getLastName())
				.phoneNumber(user.getPhoneNumber())
				.profilePictureUrl(user.getProfilePictureUrl())
				.role(user.getRole())
				.status(user.getStatus())
				.createdAt(user.getCreatedAt())
				.updatedAt(user.getUpdatedAt())
				.createdBy(user.getCreatedBy())
				.updatedBy(user.getUpdatedBy());

		// Attach role-specific profile details if they exist
		if (user.getRole() == UserRole.DRIVER) {
			driverProfileRepository.findByUser(user).ifPresent(profile -> {
				responseBuilder.driverProfile(UserDto.DriverProfileResponse.builder()
						.id(profile.getId())
						.licenseNumber(profile.getLicenseNumber())
						.yearsOfExperience(profile.getYearsOfExperience())
						.vehicleAssignedId(profile.getVehicleAssignedId())
						.status(profile.getStatus().name())
						.build());
			});
		} else if (user.getRole() == UserRole.FLEET_MANAGER) {
			fleetManagerProfileRepository.findByUser(user).ifPresent(profile -> {
				responseBuilder.fleetManagerProfile(UserDto.FleetManagerProfileResponse.builder()
						.id(profile.getId())
						.assignedRegion(profile.getAssignedRegion())
						.hubId(profile.getHubId())
						.build());
			});
		}

		return responseBuilder.build();
	}
}
