package com.volteryde.auth.controller;

import com.volteryde.auth.dto.*;
import com.volteryde.auth.service.AuthService;
import com.volteryde.auth.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication REST Controller
 * 
 * Handles login, registration, token refresh, and password management
 */
@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

	private final AuthService authService;
	private final JwtService jwtService;

	public AuthController(AuthService authService, JwtService jwtService) {
		this.authService = authService;
		this.jwtService = jwtService;
	}

	/**
	 * Login endpoint — returns AuthResponse normally, or TwoFactorChallengeResponse for admins with/without 2FA
	 */
	@PostMapping("/login")
	public ResponseEntity<?> login(
			@Valid @RequestBody LoginRequest request,
			HttpServletRequest httpRequest) {

		String deviceInfo = httpRequest.getHeader("User-Agent");
		String ipAddress = getClientIp(httpRequest);

		logger.info("Login request from IP: {}", ipAddress);

		Object response = authService.login(request, deviceInfo, ipAddress);
		return ResponseEntity.ok(response);
	}

	/**
	 * Registration endpoint
	 */
	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(
			@Valid @RequestBody RegisterRequest request,
			HttpServletRequest httpRequest) {

		String deviceInfo = httpRequest.getHeader("User-Agent");
		String ipAddress = getClientIp(httpRequest);

		logger.info("Registration request from IP: {}", ipAddress);

		AuthResponse response = authService.register(request, deviceInfo, ipAddress);
		return ResponseEntity.ok(response);
	}

	/**
	 * Refresh token endpoint
	 */
	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refreshToken(
			@Valid @RequestBody RefreshTokenRequest request,
			HttpServletRequest httpRequest) {

		String deviceInfo = httpRequest.getHeader("User-Agent");
		String ipAddress = getClientIp(httpRequest);

		AuthResponse response = authService.refreshToken(request, deviceInfo, ipAddress);
		return ResponseEntity.ok(response);
	}

	/**
	 * Logout endpoint
	 */
	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshTokenRequest request) {
		if (request != null && request.getRefreshToken() != null) {
			authService.logout(request.getRefreshToken());
		}
		return ResponseEntity.ok().build();
	}

	/**
	 * Logout from all devices
	 */
	@PostMapping("/logout-all")
	public ResponseEntity<Void> logoutAll(@RequestHeader("Authorization") String authHeader) {
		String token = authHeader.replace("Bearer ", "");
		String userId = jwtService.extractUserId(token);
		authService.logoutAll(userId);
		return ResponseEntity.ok().build();
	}

	/**
	 * Request password reset
	 */
	@PostMapping("/password/reset")
	public ResponseEntity<Void> requestPasswordReset(@RequestBody PasswordResetRequest request) {
		authService.requestPasswordReset(request.getEmail());
		return ResponseEntity.ok().build();
	}

	/**
	 * Confirm password reset
	 */
	@PostMapping("/password/reset/confirm")
	public ResponseEntity<Void> confirmPasswordReset(@RequestBody PasswordResetConfirmRequest request) {
		authService.confirmPasswordReset(request.getToken(), request.getNewPassword());
		return ResponseEntity.ok().build();
	}

	/**
	 * Verify email
	 */
	@GetMapping("/verify-email")
	public ResponseEntity<String> verifyEmail(@RequestParam String token) {
		authService.verifyEmail(token);
		return ResponseEntity.ok("Email verified successfully");
	}

	/**
	 * Get current user info
	 */
	@GetMapping("/me")
	public ResponseEntity<UserDto> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
		String token = authHeader.replace("Bearer ", "");
		String userId = jwtService.extractUserId(token);
		UserDto user = authService.getCurrentUser(userId);
		return ResponseEntity.ok(user);
	}

	/**
	 * Validate token (for other services)
	 */
	@PostMapping("/validate")
	public ResponseEntity<TokenValidationResponse> validateToken(
			@RequestHeader("Authorization") String authHeader) {

		String token = authHeader.replace("Bearer ", "");
		boolean valid = jwtService.validateToken(token);

		TokenValidationResponse response = new TokenValidationResponse();
		response.setValid(valid);

		if (valid) {
			response.setUserId(jwtService.extractUserId(token));
			response.setEmail(jwtService.extractEmail(token));
			response.setRoles(jwtService.extractRoles(token));
		}

		return ResponseEntity.ok(response);
	}

	// ==================== Two-Factor Authentication ====================

	/** Initiate optional TOTP setup (already-logged-in user). */
	@PostMapping("/2fa/setup")
	public ResponseEntity<TwoFactorSetupResponse> setupTwoFactor(
			@RequestHeader("Authorization") String authHeader) {
		String token = authHeader.replace("Bearer ", "");
		String userId = jwtService.extractUserId(token);
		return ResponseEntity.ok(authService.setupTwoFactor(userId));
	}

	/** Confirm first TOTP code to activate 2FA. */
	@PostMapping("/2fa/enable")
	public ResponseEntity<Void> enableTwoFactor(
			@RequestHeader("Authorization") String authHeader,
			@RequestBody Map<String, String> request) {
		String token = authHeader.replace("Bearer ", "");
		String userId = jwtService.extractUserId(token);
		authService.enableTwoFactor(userId, request.get("code"));
		return ResponseEntity.ok().build();
	}

	/** Disable 2FA — requires a valid current TOTP code. */
	@PostMapping("/2fa/disable")
	public ResponseEntity<Void> disableTwoFactor(
			@RequestHeader("Authorization") String authHeader,
			@RequestBody Map<String, String> request) {
		String token = authHeader.replace("Bearer ", "");
		String userId = jwtService.extractUserId(token);
		authService.disableTwoFactor(userId, request.get("code"));
		return ResponseEntity.ok().build();
	}

	/** Complete a 2FA login challenge — returns full auth tokens. */
	@PostMapping("/login/2fa")
	public ResponseEntity<AuthResponse> verifyTwoFactor(
			@RequestBody Map<String, String> request,
			HttpServletRequest httpRequest) {
		String deviceInfo = httpRequest.getHeader("User-Agent");
		String ipAddress = getClientIp(httpRequest);
		AuthResponse response = authService.verifyTwoFactor(
				request.get("challengeToken"), request.get("code"), deviceInfo, ipAddress);
		return ResponseEntity.ok(response);
	}

	/**
	 * Forced 2FA setup step 1 — admin login returned setupRequired=true.
	 * Validates the challengeToken (scope=2FA_SETUP_REQUIRED) and returns TOTP QR URI.
	 */
	@PostMapping("/2fa/force-setup")
	public ResponseEntity<TwoFactorSetupResponse> forceSetupTwoFactor(
			@RequestBody Map<String, String> request) {
		return ResponseEntity.ok(authService.forceSetupTwoFactor(request.get("challengeToken")));
	}

	/**
	 * Forced 2FA setup step 2 — verify first TOTP code, activate 2FA, and return full auth tokens.
	 */
	@PostMapping("/2fa/force-enable")
	public ResponseEntity<AuthResponse> forceEnableTwoFactor(
			@RequestBody Map<String, String> request,
			HttpServletRequest httpRequest) {
		String deviceInfo = httpRequest.getHeader("User-Agent");
		String ipAddress = getClientIp(httpRequest);
		AuthResponse response = authService.forceEnableTwoFactor(
				request.get("challengeToken"), request.get("code"), deviceInfo, ipAddress);
		return ResponseEntity.ok(response);
	}

	private String getClientIp(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
			return xForwardedFor.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}

	/**
	 * Initiate phone signup
	 */
	@PostMapping("/signup/phone/init")
	public ResponseEntity<Void> initiatePhoneSignup(@Valid @RequestBody PhoneInitRequest request) {
		authService.initiatePhoneSignup(request);
		return ResponseEntity.ok().build();
	}

	/**
	 * Verify phone OTP
	 */
	@PostMapping("/signup/phone/verify")
	public ResponseEntity<PhoneVerifyResponse> verifyPhoneSignup(@Valid @RequestBody PhoneVerifyRequest request) {
		return ResponseEntity.ok(authService.verifyPhoneSignup(request));
	}

	/**
	 * Complete signup profile
	 */
	@PostMapping("/signup/complete")
	public ResponseEntity<AuthResponse> completeSignup(
			@Valid @RequestBody SignupCompleteRequest request,
			HttpServletRequest httpRequest) {
		String deviceInfo = httpRequest.getHeader("User-Agent");
		String ipAddress = getClientIp(httpRequest);
		return ResponseEntity.ok(authService.completeProfile(request, deviceInfo, ipAddress));
	}
}
