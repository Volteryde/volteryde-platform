package com.volteryde.auth.service;

import com.volteryde.auth.dto.AuthResponse;
import com.volteryde.auth.dto.LoginRequest;
import com.volteryde.auth.dto.RegisterRequest;
import com.volteryde.auth.entity.RefreshTokenEntity;
import com.volteryde.auth.entity.RoleEntity;
import com.volteryde.auth.entity.UserEntity;
import com.volteryde.auth.exception.AuthException;
import com.volteryde.auth.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class AuthServiceTest {

	@Mock
	private UserRepository userRepository;
	@Mock
	private RoleRepository roleRepository;
	@Mock
	private RefreshTokenRepository refreshTokenRepository;
	@Mock
	private InviteCodeRepository inviteCodeRepository; // Mocking this even if not used in basic login
	@Mock
	private JwtService jwtService;
	@Mock
	private PasswordEncoder passwordEncoder;
	@Mock
	private EmailService emailService;
	@Mock
	private ActivityLogService activityLogService;
	@Mock
	private PhoneVerificationRepository phoneVerificationRepository;

	@InjectMocks
	private AuthService authService;

	private UserEntity user;

	@BeforeEach
	void setUp() {
		user = new UserEntity();
		user.setId(UUID.randomUUID().toString());
		user.setEmail("test@example.com");
		user.setPasswordHash("hashedPassword");
		user.setEnabled(true);
		user.setRoles(Set.of(new RoleEntity(RoleEntity.UserRole.DRIVER)));
	}

	@Test
	void login_ShouldReturnTokens_WhenCredentialsAreValid() {
		LoginRequest request = new LoginRequest();
		request.setIdentifier("test@example.com");
		request.setPassword("password");

		when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("password", "hashedPassword")).thenReturn(true);
		when(jwtService.generateAccessToken(user)).thenReturn("access-token");
		when(jwtService.generateRefreshToken(any(), any(), any())).thenReturn(new RefreshTokenEntity());
		when(jwtService.getExpirationInSeconds()).thenReturn(3600L);

		AuthResponse response = authService.login(request, "device-1", "127.0.0.1");

		assertNotNull(response);
		assertEquals("access-token", response.getAccessToken());
		verify(activityLogService).logLoginSuccess(any(), anyString(), anyString());
	}

	@Test
	void login_ShouldThrowException_WhenPasswordInvalid() {
		LoginRequest request = new LoginRequest();
		request.setIdentifier("test@example.com");
		request.setPassword("wrong-password");

		when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("wrong-password", "hashedPassword")).thenReturn(false);

		assertThrows(AuthException.class, () -> authService.login(request, "device", "ip"));
		verify(activityLogService).logLoginFailed(anyString(), anyString(), anyString(), anyString());
	}

	@Test
	void register_ShouldCreateUser_WhenEmailUnique() {
		RegisterRequest request = new RegisterRequest();
		request.setEmail("new@example.com");
		request.setPassword("password");
		request.setFirstName("New");
		request.setLastName("User");

		when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
		when(passwordEncoder.encode("password")).thenReturn("hashed");
		when(roleRepository.findByName(RoleEntity.UserRole.DRIVER))
				.thenReturn(Optional.of(new RoleEntity(RoleEntity.UserRole.DRIVER)));
		when(userRepository.save(any(UserEntity.class))).thenAnswer(i -> i.getArguments()[0]); // Return saved user
		when(jwtService.generateAccessToken(any())).thenReturn("token");
		when(jwtService.generateRefreshToken(any(), any(), any())).thenReturn(new RefreshTokenEntity());

		AuthResponse response = authService.register(request, "device", "ip");

		assertNotNull(response);
		assertEquals("token", response.getAccessToken());
		verify(activityLogService).logRegistration(any(), anyString(), anyString());
	}
}
