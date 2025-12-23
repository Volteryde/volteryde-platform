package com.volteryde.auth.service;

import com.volteryde.auth.dto.*;
import com.volteryde.auth.entity.InviteCodeEntity;
import com.volteryde.auth.entity.RefreshTokenEntity;
import com.volteryde.auth.entity.RoleEntity;
import com.volteryde.auth.entity.RoleEntity.UserRole;
import com.volteryde.auth.entity.UserEntity;
import com.volteryde.auth.exception.AuthException;
import com.volteryde.auth.repository.InviteCodeRepository;
import com.volteryde.auth.repository.RefreshTokenRepository;
import com.volteryde.auth.repository.RoleRepository;
import com.volteryde.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Authentication service handling login, registration, and token management
 */
@Service
@Transactional
@SuppressWarnings("null")
public class AuthService {

	private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final InviteCodeRepository inviteCodeRepository;
	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;
	private final EmailService emailService;

	public AuthService(
			UserRepository userRepository,
			RoleRepository roleRepository,
			RefreshTokenRepository refreshTokenRepository,
			InviteCodeRepository inviteCodeRepository,
			JwtService jwtService,
			PasswordEncoder passwordEncoder,
			EmailService emailService) {
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.inviteCodeRepository = inviteCodeRepository;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.emailService = emailService;
	}

	/**
	 * Authenticate user and return tokens
	 */
	public AuthResponse login(LoginRequest request, String deviceInfo, String ipAddress) {
		logger.info("Login attempt for email: {}", request.getEmail());

		UserEntity user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new AuthException("Invalid email or password"));

		if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
			throw new AuthException("Invalid email or password");
		}

		if (!user.getEnabled()) {
			throw new AuthException("Account is disabled");
		}

		// Update last login
		user.setLastLoginAt(LocalDateTime.now());
		userRepository.save(user);

		return generateAuthResponse(user, deviceInfo, ipAddress);
	}

	/**
	 * Register a new user
	 */
	public AuthResponse register(RegisterRequest request, String deviceInfo, String ipAddress) {
		logger.info("Registration attempt for email: {}", request.getEmail());

		if (userRepository.existsByEmail(request.getEmail())) {
			throw new AuthException("Email is already registered");
		}

		// Create new user
		UserEntity user = new UserEntity();
		user.setEmail(request.getEmail());
		user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		user.setPhoneNumber(request.getPhoneNumber());
		user.setOrganizationId(request.getOrganizationId());
		user.setEnabled(true);
		user.setEmailVerified(false);
		user.setEmailVerificationToken(UUID.randomUUID().toString());

		// Assign default role based on invite code or default to DRIVER
		Set<RoleEntity> roles = new HashSet<>();
		UserRole defaultRole = determineDefaultRole(request.getInviteCode());
		RoleEntity role = roleRepository.findByName(defaultRole)
				.orElseGet(() -> {
					RoleEntity newRole = new RoleEntity(defaultRole);
					return roleRepository.save(newRole);
				});
		roles.add(role);
		user.setRoles(roles);

		user = userRepository.save(user);
		logger.info("User registered successfully: {}", user.getId());

		return generateAuthResponse(user, deviceInfo, ipAddress);
	}

	/**
	 * Refresh access token using refresh token
	 */
	public AuthResponse refreshToken(RefreshTokenRequest request, String deviceInfo, String ipAddress) {
		RefreshTokenEntity refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
				.orElseThrow(() -> new AuthException("Invalid refresh token"));

		if (!refreshToken.isValid()) {
			throw new AuthException("Refresh token is expired or revoked");
		}

		UserEntity user = refreshToken.getUser();

		// Revoke old refresh token
		refreshToken.setRevoked(true);
		refreshTokenRepository.save(refreshToken);

		return generateAuthResponse(user, deviceInfo, ipAddress);
	}

	/**
	 * Logout user by revoking refresh token
	 */
	public void logout(String refreshToken) {
		refreshTokenRepository.revokeToken(refreshToken);
		logger.info("User logged out, token revoked");
	}

	/**
	 * Logout user from all devices
	 */
	public void logoutAll(String userId) {
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		refreshTokenRepository.revokeAllUserTokens(user);
		logger.info("User logged out from all devices: {}", userId);
	}

	/**
	 * Request password reset
	 */
	public void requestPasswordReset(String email) {
		UserEntity user = userRepository.findByEmail(email)
				.orElse(null);

		if (user != null) {
			user.setPasswordResetToken(UUID.randomUUID().toString());
			user.setPasswordResetExpiry(LocalDateTime.now().plusHours(24));
			userRepository.save(user);

			// Send password reset email
			emailService.sendPasswordResetEmail(
					user.getEmail(),
					user.getPasswordResetToken(),
					user.getFirstName());
			logger.info("Password reset email sent for: {}", email);
		}
		// Don't reveal if email exists or not for security
	}

	/**
	 * Confirm password reset
	 */
	public void confirmPasswordReset(String token, String newPassword) {
		UserEntity user = userRepository.findByPasswordResetToken(token)
				.orElseThrow(() -> new AuthException("Invalid or expired reset token"));

		if (user.getPasswordResetExpiry() == null ||
				user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
			throw new AuthException("Reset token has expired");
		}

		user.setPasswordHash(passwordEncoder.encode(newPassword));
		user.setPasswordResetToken(null);
		user.setPasswordResetExpiry(null);
		userRepository.save(user);

		// Revoke all refresh tokens for security
		refreshTokenRepository.revokeAllUserTokens(user);

		logger.info("Password reset completed for user: {}", user.getId());
	}

	/**
	 * Verify email
	 */
	public void verifyEmail(String token) {
		UserEntity user = userRepository.findByEmailVerificationToken(token)
				.orElseThrow(() -> new AuthException("Invalid verification token"));

		user.setEmailVerified(true);
		user.setEmailVerificationToken(null);
		userRepository.save(user);

		logger.info("Email verified for user: {}", user.getId());
	}

	/**
	 * Get current user info
	 */
	public UserDto getCurrentUser(String userId) {
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		return mapToUserDto(user);
	}

	private AuthResponse generateAuthResponse(UserEntity user, String deviceInfo, String ipAddress) {
		String accessToken = jwtService.generateAccessToken(user);
		RefreshTokenEntity refreshToken = jwtService.generateRefreshToken(user, deviceInfo, ipAddress);
		refreshTokenRepository.save(refreshToken);

		return new AuthResponse(
				accessToken,
				refreshToken.getToken(),
				jwtService.getExpirationInSeconds(),
				mapToUserDto(user));
	}

	private UserDto mapToUserDto(UserEntity user) {
		UserDto dto = new UserDto();
		dto.setId(user.getId());
		dto.setEmail(user.getEmail());
		dto.setFirstName(user.getFirstName());
		dto.setLastName(user.getLastName());
		dto.setPhoneNumber(user.getPhoneNumber());
		dto.setAvatarUrl(user.getAvatarUrl());
		dto.setOrganizationId(user.getOrganizationId());
		dto.setEmailVerified(user.getEmailVerified());
		dto.setRoles(user.getRoles().stream()
				.map(role -> role.getName().name())
				.collect(Collectors.toList()));
		return dto;
	}

	private UserRole determineDefaultRole(String inviteCode) {
		if (inviteCode == null || inviteCode.isBlank()) {
			return UserRole.DRIVER; // Default for public registration
		}

		// Validate invite code and get assigned role
		return inviteCodeRepository.findByCodeAndActiveTrue(inviteCode)
				.filter(InviteCodeEntity::isValid)
				.map(code -> {
					// Increment usage count
					code.incrementUsage();
					inviteCodeRepository.save(code);
					logger.info("Invite code {} used, assigned role: {}", inviteCode, code.getAssignedRole());
					return code.getAssignedRole();
				})
				.orElseGet(() -> {
					logger.warn("Invalid or expired invite code: {}", inviteCode);
					return UserRole.DRIVER;
				});
	}
}
