package com.volteryde.usermanagement.service.impl;

import com.volteryde.usermanagement.dto.UserDto;
import com.volteryde.usermanagement.model.User;
import com.volteryde.usermanagement.model.UserRole;
import com.volteryde.usermanagement.repository.UserRepository;
import com.volteryde.usermanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final com.volteryde.usermanagement.service.ActivityLogService activityLogService;

	@Override
	@Transactional
	@SuppressWarnings("null")
	public UserDto.UserResponse createUser(UserDto.CreateUserRequest request) {
		log.info("Creating user with email: {}", request.getEmail());

		if (userRepository.existsByEmail(request.getEmail())) {
			throw new IllegalArgumentException("User with email already exists");
		}

		User user = User.builder()
				.email(request.getEmail())
				.authId(request.getAuthId()) // Can be null initially if sync happens later
				.firstName(request.getFirstName())
				.lastName(request.getLastName())
				.phoneNumber(request.getPhoneNumber())
				.role(request.getRole() != null ? request.getRole() : UserRole.CLIENT)
				.isActive(true)
				.build();

		User savedUser = userRepository.save(user);

		activityLogService.logActivity(
				savedUser.getId(),
				"CREATE_USER",
				"USER",
				savedUser.getId(),
				"User registered: " + savedUser.getEmail(),
				"127.0.0.1");

		return mapToResponse(savedUser);
	}

	@Override
	public UserDto.UserResponse getUserProfile(UUID userId) {
		if (userId == null)
			throw new IllegalArgumentException("User ID cannot be null");
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
	@Transactional
	@SuppressWarnings("null")
	public UserDto.UserResponse updateUserProfile(UUID userId, UserDto.UpdateProfileRequest request) {
		if (userId == null)
			throw new IllegalArgumentException("User ID cannot be null");
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (request.getFirstName() != null)
			user.setFirstName(request.getFirstName());
		if (request.getLastName() != null)
			user.setLastName(request.getLastName());
		if (request.getPhoneNumber() != null)
			user.setPhoneNumber(request.getPhoneNumber());
		if (request.getProfilePictureUrl() != null)
			user.setProfilePictureUrl(request.getProfilePictureUrl());

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

	private UserDto.UserResponse mapToResponse(User user) {
		return UserDto.UserResponse.builder()
				.id(user.getId())
				.email(user.getEmail())
				.firstName(user.getFirstName())
				.lastName(user.getLastName())
				.phoneNumber(user.getPhoneNumber())
				.profilePictureUrl(user.getProfilePictureUrl())
				.role(user.getRole())
				.isActive(user.isActive())
				.createdAt(user.getCreatedAt())
				.build();
	}
}
