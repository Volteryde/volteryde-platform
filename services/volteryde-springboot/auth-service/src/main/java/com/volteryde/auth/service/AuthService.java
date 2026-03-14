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
import com.volteryde.auth.repository.PhoneVerificationRepository;
import com.volteryde.auth.entity.PhoneVerificationEntity;
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
	private final ActivityLogService activityLogService;
	private final PhoneVerificationRepository phoneVerificationRepository;
	private final com.volteryde.auth.client.UserServiceClient userServiceClient;
	private final TotpService totpService;

	/** Roles that require mandatory 2FA (M7). */
	private static final Set<RoleEntity.UserRole> MFA_REQUIRED_ROLES = Set.of(
			RoleEntity.UserRole.SUPER_ADMIN,
			RoleEntity.UserRole.ADMIN
	);

	/**
	 * Roles that cannot be self-assigned via public registration — a valid,
	 * matching invite code is required (R3).
	 */
	private static final Set<RoleEntity.UserRole> INVITE_REQUIRED_ROLES = Set.of(
			RoleEntity.UserRole.FLEET_MANAGER,
			RoleEntity.UserRole.DISPATCHER,
			RoleEntity.UserRole.SYSTEM_SUPPORT,
			RoleEntity.UserRole.CUSTOMER_SUPPORT
	);

	public AuthService(
			UserRepository userRepository,
			RoleRepository roleRepository,
			RefreshTokenRepository refreshTokenRepository,
			InviteCodeRepository inviteCodeRepository,
			JwtService jwtService,
			PasswordEncoder passwordEncoder,
			EmailService emailService,
			ActivityLogService activityLogService,
			PhoneVerificationRepository phoneVerificationRepository,
			com.volteryde.auth.client.UserServiceClient userServiceClient,
			TotpService totpService) {
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.inviteCodeRepository = inviteCodeRepository;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.emailService = emailService;
		this.activityLogService = activityLogService;
		this.phoneVerificationRepository = phoneVerificationRepository;
		this.userServiceClient = userServiceClient;
		this.totpService = totpService;
	}

	/**
	 * Authenticate user and return tokens (or a 2FA challenge for accounts with MFA).
	 * Supports login via Access ID (VLT-XXXXXX) or Email.
	 *
	 * Returns {@link AuthResponse} on success, or {@link TwoFactorChallengeResponse} when 2FA is required.
	 */
	public Object login(LoginRequest request, String deviceInfo, String ipAddress) {
		String identifier = request.getIdentifier();
		logger.info("Login attempt for identifier: {}", identifier);

		try {
			// Find user by access ID or email
			UserEntity user;
			if (request.isAccessId()) {
				// Login via Access ID (VLT-XXXXXX format)
				user = userRepository.findByAccessId(identifier.toUpperCase())
						.orElseThrow(() -> {
							activityLogService.logLoginFailed(identifier, ipAddress, deviceInfo, "Invalid Access ID");
							return new AuthException("Invalid Access ID or Passcode");
						});
			} else {
				// Login via Email
				user = userRepository.findByEmail(identifier)
						.orElseThrow(() -> {
							activityLogService.logLoginFailed(identifier, ipAddress, deviceInfo, "User not found");
							return new AuthException("Invalid Access ID or Passcode");
						});
			}

			if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
				activityLogService.logLoginFailed(identifier, ipAddress, deviceInfo, "Invalid password");
				throw new AuthException("Invalid Access ID or Passcode");
			}

			if (!user.getEnabled()) {
				activityLogService.logLoginFailed(identifier, ipAddress, deviceInfo, "Account disabled");
				throw new AuthException("Account is disabled");
			}

			// Update last login
			user.setLastLoginAt(LocalDateTime.now());
			userRepository.save(user);

			// Log successful login
			activityLogService.logLoginSuccess(user, ipAddress, deviceInfo);

			// M7: Enforce 2FA for privileged roles
			boolean isPrivilegedRole = user.getRoles().stream()
					.anyMatch(r -> MFA_REQUIRED_ROLES.contains(r.getName()));

			if (isPrivilegedRole) {
				if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
					// Admin has not set up 2FA yet — force the setup flow
					String setupToken = jwtService.generate2FaChallengeToken(user.getId(), "2FA_SETUP_REQUIRED");
					logger.warn("Admin login without 2FA configured — forcing setup: {}", user.getId());
					return new TwoFactorChallengeResponse(true, setupToken);
				}
				// Admin has 2FA enabled — issue a verification challenge
				String challengeToken = jwtService.generate2FaChallengeToken(user.getId(), "2FA_CHALLENGE");
				return new TwoFactorChallengeResponse(false, challengeToken);
			}

			// Non-privileged users with voluntary 2FA enabled also get a challenge
			if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
				String challengeToken = jwtService.generate2FaChallengeToken(user.getId(), "2FA_CHALLENGE");
				return new TwoFactorChallengeResponse(false, challengeToken);
			}

			return generateAuthResponse(user, deviceInfo, ipAddress);
		} catch (AuthException e) {
			throw e; // Re-throw, already logged
		} catch (Exception e) {
			activityLogService.logLoginFailed(identifier, ipAddress, deviceInfo, "Unexpected error: " + e.getMessage());
			throw e;
		}
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
		if (request.getAccessId() != null) {
			user.setAccessId(request.getAccessId());
		}
		user.setEmailVerified(false);
		user.setEmailVerificationToken(UUID.randomUUID().toString());

		// Assign role
		Set<RoleEntity> roles = new HashSet<>();
		UserRole roleEnum;

		if (request.getRole() != null && !request.getRole().isEmpty()) {
			// Explicit role requested — parse and validate invite code for privileged roles
			try {
				roleEnum = UserRole.valueOf(request.getRole());
			} catch (IllegalArgumentException e) {
				logger.warn("Invalid role requested: {}, falling back to default", request.getRole());
				roleEnum = determineDefaultRole(request.getInviteCode());
			}
			// R3: explicit privileged-role requests require a matching invite code
			if (INVITE_REQUIRED_ROLES.contains(roleEnum)) {
				validateInviteCodeForRole(request.getInviteCode(), roleEnum);
			}
		} else {
			// Default logic — invite code (if provided) determines role
			roleEnum = determineDefaultRole(request.getInviteCode());
		}

		final UserRole finalRoleEnum = roleEnum;
		RoleEntity role = roleRepository.findByName(finalRoleEnum)
				.orElseGet(() -> {
					RoleEntity newRole = new RoleEntity(finalRoleEnum, ipAddress);
					return roleRepository.save(newRole);
				});
		roles.add(role);
		user.setRoles(roles);

		user = userRepository.save(user);
		logger.info("User registered successfully: {}", user.getId());

		// Create user profile in User Management Service
		try {
			com.volteryde.auth.dto.CreateUserRequest createUserRequest = new com.volteryde.auth.dto.CreateUserRequest(
					user.getEmail(),
					user.getId(), // Pass Auth Service ID as authId
					user.getFirstName(),
					user.getLastName(),
					user.getPhoneNumber(),
					finalRoleEnum.name(),
					"AUTH_SERVICE");

			userServiceClient.createUser(createUserRequest);
			logger.info("User profile created in User Management Service for authId: {}", user.getId());
		} catch (Exception e) {
			logger.error("Failed to create user profile in User Management Service: {}", e.getMessage());
			// Note: We don't rollback registration here, but in production, we might want
			// to
			// implement eventual consistency (e.g., via message queue) or rollback.
		}

		// Log registration activity
		activityLogService.logRegistration(user, ipAddress, deviceInfo);

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

	// ==================== Two-Factor Authentication ====================

	/** Step 1: generate TOTP secret and QR code URI. Requires an active session (Bearer token). */
	public TwoFactorSetupResponse setupTwoFactor(String userId) {
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		String secret = totpService.generateSecret();
		user.setTwoFactorSecretPending(secret);
		userRepository.save(user);
		String account = user.getEmail() != null ? user.getEmail() : userId;
		return new TwoFactorSetupResponse(secret, totpService.getOtpAuthUri(secret, account));
	}

	/** Step 2: confirm first TOTP code to activate 2FA. */
	public void enableTwoFactor(String userId, String code) {
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		String pending = user.getTwoFactorSecretPending();
		if (pending == null) {
			throw new AuthException("No pending 2FA setup. Please call /2fa/setup first.");
		}
		if (!totpService.verify(pending, code)) {
			throw new AuthException("Invalid TOTP code");
		}
		user.setTwoFactorSecret(pending);
		user.setTwoFactorSecretPending(null);
		user.setTwoFactorEnabled(true);
		userRepository.save(user);
		logger.info("2FA enabled for user: {}", userId);
	}

	/** Disable 2FA — requires a valid current TOTP code. */
	public void disableTwoFactor(String userId, String code) {
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) return;
		if (!totpService.verify(user.getTwoFactorSecret(), code)) {
			throw new AuthException("Invalid TOTP code");
		}
		user.setTwoFactorEnabled(false);
		user.setTwoFactorSecret(null);
		user.setTwoFactorSecretPending(null);
		userRepository.save(user);
		logger.info("2FA disabled for user: {}", userId);
	}

	/**
	 * Complete a standard 2FA login challenge (scope must be "2FA_CHALLENGE").
	 * Returns full auth tokens on success.
	 */
	public AuthResponse verifyTwoFactor(String challengeToken, String code,
			String deviceInfo, String ipAddress) {
		if (!jwtService.validateToken(challengeToken)) {
			throw new AuthException("Invalid or expired 2FA challenge token");
		}
		String scope = jwtService.extractScope(challengeToken);
		if (!"2FA_CHALLENGE".equals(scope)) {
			throw new AuthException("Invalid token scope");
		}
		String userId = jwtService.extractUserId(challengeToken);
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		if (!Boolean.TRUE.equals(user.getTwoFactorEnabled()) || !totpService.verify(user.getTwoFactorSecret(), code)) {
			throw new AuthException("Invalid TOTP code");
		}
		return generateAuthResponse(user, deviceInfo, ipAddress);
	}

	/**
	 * Admin forced-setup: return QR code URI using the "2FA_SETUP_REQUIRED" challenge token.
	 * Does NOT require a normal Bearer token — uses the scoped challenge token from login.
	 */
	public TwoFactorSetupResponse forceSetupTwoFactor(String challengeToken) {
		if (!jwtService.validateToken(challengeToken)) {
			throw new AuthException("Invalid or expired setup token");
		}
		if (!"2FA_SETUP_REQUIRED".equals(jwtService.extractScope(challengeToken))) {
			throw new AuthException("Invalid token scope");
		}
		String userId = jwtService.extractUserId(challengeToken);
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		String secret = totpService.generateSecret();
		user.setTwoFactorSecretPending(secret);
		userRepository.save(user);
		String account = user.getEmail() != null ? user.getEmail() : userId;
		return new TwoFactorSetupResponse(secret, totpService.getOtpAuthUri(secret, account));
	}

	/**
	 * Admin forced-enable: confirm the first TOTP code using the "2FA_SETUP_REQUIRED" challenge token,
	 * activate 2FA, and return full auth tokens in one step.
	 */
	public AuthResponse forceEnableTwoFactor(String challengeToken, String code,
			String deviceInfo, String ipAddress) {
		if (!jwtService.validateToken(challengeToken)) {
			throw new AuthException("Invalid or expired setup token");
		}
		if (!"2FA_SETUP_REQUIRED".equals(jwtService.extractScope(challengeToken))) {
			throw new AuthException("Invalid token scope");
		}
		String userId = jwtService.extractUserId(challengeToken);
		UserEntity user = userRepository.findById(userId)
				.orElseThrow(() -> new AuthException("User not found"));
		String pending = user.getTwoFactorSecretPending();
		if (pending == null) {
			throw new AuthException("No pending 2FA setup. Please call /2fa/force-setup first.");
		}
		if (!totpService.verify(pending, code)) {
			throw new AuthException("Invalid TOTP code");
		}
		user.setTwoFactorSecret(pending);
		user.setTwoFactorSecretPending(null);
		user.setTwoFactorEnabled(true);
		userRepository.save(user);
		logger.info("Admin 2FA force-enabled for user: {}", userId);
		return generateAuthResponse(user, deviceInfo, ipAddress);
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
		dto.setAccessId(user.getAccessId());
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

	/**
	 * R3: Validate that the provided invite code exists, is active, and grants the
	 * expected role.  Called only when a privileged role is explicitly requested via
	 * the {@code role} field in {@link com.volteryde.auth.dto.RegisterRequest}.
	 */
	private void validateInviteCodeForRole(String inviteCode, UserRole expectedRole) {
		if (inviteCode == null || inviteCode.isBlank()) {
			throw new AuthException(
					"An invite code is required to register as " + expectedRole.name());
		}
		InviteCodeEntity invite = inviteCodeRepository.findByCodeAndActiveTrue(inviteCode)
				.filter(InviteCodeEntity::isValid)
				.orElseThrow(() -> new AuthException("Invalid or expired invite code"));
		if (invite.getAssignedRole() != expectedRole) {
			throw new AuthException(
					"Invite code does not grant the requested role " + expectedRole.name());
		}
		// Increment usage so this invite code slot is consumed
		invite.incrementUsage();
		inviteCodeRepository.save(invite);
		logger.info("Invite code {} validated and consumed for explicit role: {}", inviteCode, expectedRole);
	}

	/**
	 * Initiate phone signup - send OTP
	 */
	public void initiatePhoneSignup(PhoneInitRequest request) {
		String phone = request.getPhone();

		if (userRepository.existsByPhoneNumber(phone)) {
			throw new AuthException("Phone number already registered. Please login.");
		}

		String code = String.valueOf((int) ((Math.random() * 900000) + 100000));

		PhoneVerificationEntity verification = new PhoneVerificationEntity();
		verification.setPhone(phone);
		verification.setCode(code);
		verification.setExpiresAt(LocalDateTime.now().plusMinutes(10));
		verification.setVerified(false);
		phoneVerificationRepository.save(verification);

		logger.info("OTP generated for {}: {}", phone, code);
		// Note: SMS Service integration will be added in a future phase.
		// For now, use the OTP logged above.
	}

	/**
	 * Verify phone OTP
	 */
	public PhoneVerifyResponse verifyPhoneSignup(PhoneVerifyRequest request) {
		PhoneVerificationEntity verification = phoneVerificationRepository
				.findTopByPhoneAndCodeAndExpiresAtAfterAndVerifiedFalse(request.getPhone(), request.getCode(),
						LocalDateTime.now())
				.orElseThrow(() -> new AuthException("Invalid or expired OTP"));

		verification.setVerified(true);
		verification.setVerifiedAt(LocalDateTime.now());
		phoneVerificationRepository.save(verification);

		String signupToken = jwtService.generateSignupToken(request.getPhone());
		return new PhoneVerifyResponse(true, signupToken, "Phone verified successfully");
	}

	/**
	 * Complete profile creation
	 */
	public AuthResponse completeProfile(SignupCompleteRequest request, String deviceInfo, String ipAddress) {
		// Validate Token
		if (!jwtService.validateToken(request.getSignupToken())) {
			throw new AuthException("Invalid or expired verification token");
		}

		String scope = jwtService.extractScope(request.getSignupToken());
		if (!"SIGNUP_VERIFIED".equals(scope)) {
			throw new AuthException("Invalid token purpose");
		}

		String phone = jwtService.extractUserId(request.getSignupToken()); // phone is subject

		if (userRepository.findByEmail(request.getEmail()).isPresent()) {
			throw new AuthException("Email already in use");
		}

		// Create User
		UserEntity user = new UserEntity();
		user.setEmail(request.getEmail());
		user.setPhoneNumber(phone);
		user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		// Generate Access ID
		user.setAccessId("VR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
		user.setEnabled(true);
		user.setEmailVerified(false);

		// Assign Role
		Set<RoleEntity> roles = new HashSet<>();
		RoleEntity role = roleRepository.findByName(UserRole.DRIVER)
				.orElseGet(() -> roleRepository.save(new RoleEntity(UserRole.DRIVER)));

		if (request.getUserType() != null) {
			try {
				UserRole requestedRole = UserRole.valueOf(request.getUserType());
				role = roleRepository.findByName(requestedRole)
						.orElseGet(() -> roleRepository.save(new RoleEntity(requestedRole)));
			} catch (IllegalArgumentException e) {
				logger.warn("Invalid role requested: {}", request.getUserType());
			}
		}
		roles.add(role);
		user.setRoles(roles);

		user = userRepository.save(user);

		// Create user profile in User Management Service
		try {
			final UserRole finalRole = user.getRoles().stream()
					.map(RoleEntity::getName)
					.findFirst()
					.orElse(UserRole.DRIVER);

			com.volteryde.auth.dto.CreateUserRequest createUserRequest = new com.volteryde.auth.dto.CreateUserRequest(
					user.getEmail(),
					user.getId(),
					user.getFirstName(),
					user.getLastName(),
					user.getPhoneNumber(),
					finalRole.name(),
					"AUTH_SERVICE");

			userServiceClient.createUser(createUserRequest);
			logger.info("User profile created in User Management Service for authId: {}", user.getId());
		} catch (Exception e) {
			logger.error("Failed to create user profile in User Management Service: {}", e.getMessage());
		}

		activityLogService.logRegistration(user, ipAddress, deviceInfo);

		return generateAuthResponse(user, deviceInfo, ipAddress);
	}
}
