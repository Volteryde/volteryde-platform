package com.volteryde.usermanagement.dto;

import com.volteryde.usermanagement.model.UserRole;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserDto {

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CreateUserRequest {
		private String email;
		private String authId;
		private String firstName;
		private String lastName;
		private String phoneNumber;
		private UserRole role; // Optional, defaults to CLIENT
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class UpdateProfileRequest {
		private String firstName;
		private String lastName;
		private String phoneNumber;
		private String profilePictureUrl;
	}

	@Data
	@Builder
	public static class UserResponse {
		private UUID id;
		private String email;
		private String firstName;
		private String lastName;
		private String phoneNumber;
		private String profilePictureUrl;
		private UserRole role;
		private boolean isActive;
		private LocalDateTime createdAt;
	}
}
