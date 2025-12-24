package com.volteryde.usermanagement.service;

import com.volteryde.usermanagement.dto.UserDto;

import java.util.UUID;

public interface UserService {
	UserDto.UserResponse createUser(UserDto.CreateUserRequest request);

	UserDto.UserResponse getUserProfile(UUID userId);

	UserDto.UserResponse getUserByAuthId(String authId);

	UserDto.UserResponse updateUserProfile(UUID userId, UserDto.UpdateProfileRequest request);
}
