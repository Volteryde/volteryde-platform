package com.volteryde.usermanagement.controller;

import com.volteryde.usermanagement.dto.UserDto;
import com.volteryde.usermanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
// @CrossOrigin(origins = "*") // Allow all for dev
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@PostMapping
	public ResponseEntity<UserDto.UserResponse> createUser(@RequestBody UserDto.CreateUserRequest request) {
		return new ResponseEntity<>(userService.createUser(request), HttpStatus.CREATED);
	}

	@GetMapping("/{id}")
	public ResponseEntity<UserDto.UserResponse> getUserById(@PathVariable UUID id) {
		return ResponseEntity.ok(userService.getUserProfile(id));
	}

	@GetMapping("/auth/{authId}")
	public ResponseEntity<UserDto.UserResponse> getUserByAuthId(@PathVariable String authId) {
		return ResponseEntity.ok(userService.getUserByAuthId(authId));
	}

	@PutMapping("/{id}")
	public ResponseEntity<UserDto.UserResponse> updateUserProfile(
			@PathVariable UUID id,
			@RequestBody UserDto.UpdateProfileRequest request) {
		return ResponseEntity.ok(userService.updateUserProfile(id, request));
	}
}
