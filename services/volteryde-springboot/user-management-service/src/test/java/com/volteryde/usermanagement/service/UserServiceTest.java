package com.volteryde.usermanagement.service;

import com.volteryde.usermanagement.dto.UserDto;
import com.volteryde.usermanagement.model.User;
import com.volteryde.usermanagement.model.UserRole;
import com.volteryde.usermanagement.repository.UserRepository;
import com.volteryde.usermanagement.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class UserServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private ActivityLogService activityLogService;

	@InjectMocks
	private UserServiceImpl userService;

	private UserDto.CreateUserRequest createRequest;
	private User user;

	@BeforeEach
	void setUp() {
		createRequest = new UserDto.CreateUserRequest();
		createRequest.setEmail("test@example.com");
		createRequest.setFirstName("John");
		createRequest.setLastName("Doe");
		createRequest.setRole(UserRole.CLIENT);

		user = User.builder()
				.id(UUID.randomUUID())
				.email("test@example.com")
				.firstName("John")
				.lastName("Doe")
				.role(UserRole.CLIENT)
				.isActive(true)
				.build();
	}

	@Test
	void createUser_ShouldReturnUser_WhenUserDoesNotExist() {
		when(userRepository.existsByEmail(anyString())).thenReturn(false);
		when(userRepository.save(any(User.class))).thenReturn(user);

		UserDto.UserResponse response = userService.createUser(createRequest);

		assertNotNull(response);
		assertEquals("test@example.com", response.getEmail());
		verify(userRepository).save(any(User.class));
		verify(activityLogService).logActivity(any(), eq("CREATE_USER"), anyString(), any(), anyString(), anyString());
	}

	@Test
	void createUser_ShouldThrowException_WhenUserExists() {
		when(userRepository.existsByEmail(anyString())).thenReturn(true);

		assertThrows(IllegalArgumentException.class, () -> userService.createUser(createRequest));
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void getUserProfile_ShouldReturnUser_WhenUserExists() {
		when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(user));

		UserDto.UserResponse response = userService.getUserProfile(user.getId());

		assertNotNull(response);
		assertEquals(user.getId(), response.getId());
	}

	@Test
	void getUserProfile_ShouldThrowException_WhenUserGeneric() {
		when(userRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

		assertThrows(IllegalArgumentException.class, () -> userService.getUserProfile(UUID.randomUUID()));
	}
}
