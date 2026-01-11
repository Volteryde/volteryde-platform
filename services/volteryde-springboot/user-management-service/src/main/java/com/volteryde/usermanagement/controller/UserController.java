package com.volteryde.usermanagement.controller;

import com.volteryde.usermanagement.dto.UserDto;
import com.volteryde.usermanagement.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for user management operations.
 * All request DTOs are validated using @Valid annotation.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	/**
	 * Get all users with optional filtering.
	 */
	@GetMapping
	public ResponseEntity<List<UserDto.UserResponse>> getAllUsers(
			@RequestParam(required = false) com.volteryde.usermanagement.model.UserRole role) {
		return ResponseEntity.ok(userService.getAllUsers(role));
	}

	/**
	 * Create a new user.
	 * Request body is validated against CreateUserRequest constraints.
	 */
	@PostMapping
	public ResponseEntity<UserDto.UserResponse> createUser(
			@Valid @RequestBody UserDto.CreateUserRequest request) {
		return new ResponseEntity<>(userService.createUser(request), HttpStatus.CREATED);
	}

	/**
	 * Get user by internal UUID.
	 */
	@GetMapping("/{id}")
	public ResponseEntity<UserDto.UserResponse> getUserById(@PathVariable UUID id) {
		return ResponseEntity.ok(userService.getUserProfile(id));
	}

	/**
	 * Get user by prefixed user ID (USR-XXXXXXXX).
	 */
	@GetMapping("/by-user-id/{userId}")
	public ResponseEntity<UserDto.UserResponse> getUserByUserId(@PathVariable String userId) {
		return ResponseEntity.ok(userService.getUserByUserId(userId));
	}

	/**
	 * Get user by auth provider ID.
	 */
	@GetMapping("/auth/{authId}")
	public ResponseEntity<UserDto.UserResponse> getUserByAuthId(@PathVariable String authId) {
		return ResponseEntity.ok(userService.getUserByAuthId(authId));
	}

	/**
	 * Update user profile.
	 * Request body is validated against UpdateProfileRequest constraints.
	 */
	@PutMapping("/{id}")
	public ResponseEntity<UserDto.UserResponse> updateUserProfile(
			@PathVariable UUID id,
			@Valid @RequestBody UserDto.UpdateProfileRequest request) {
		return ResponseEntity.ok(userService.updateUserProfile(id, request));
	}

	/**
	 * Update user account status.
	 * Status transitions are validated by the service layer.
	 */
	@PatchMapping("/{id}/status")
	public ResponseEntity<UserDto.UserResponse> updateUserStatus(
			@PathVariable UUID id,
			@Valid @RequestBody UserDto.UpdateStatusRequest request) {
		return ResponseEntity.ok(userService.updateUserStatus(id, request));
	}
}
