package com.volteryde.clientauth.controller;

import com.volteryde.clientauth.dto.*;
import com.volteryde.clientauth.service.ClientAuthService;
import com.volteryde.clientauth.service.ClientJwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Client Authentication REST Controller
 * 
 * Handles authentication for Riders (external mobile clients).
 * Drivers are internal workers and should use auth-service instead.
 */
@RestController
@RequestMapping("/client/auth")
@CrossOrigin(
    origins = {
        "https://app.volteryde.org",
        "https://auth.volteryde.org",
        "https://admin.volteryde.org",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080"
    },
    allowedHeaders = { "Authorization", "Content-Type", "X-Requested-With" },
    methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS }
)
public class ClientAuthController {

    private static final Logger logger = LoggerFactory.getLogger(ClientAuthController.class);

    private final ClientAuthService authService;
    private final ClientJwtService jwtService;

    public ClientAuthController(ClientAuthService authService, ClientJwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    // ==================== OTP Authentication ====================

    @PostMapping("/otp/send")
    public ResponseEntity<Void> sendOtp(
            @Valid @RequestBody OtpInitRequest request,
            HttpServletRequest httpRequest) {
        logger.info("OTP send request received");
        String ipAddress = getClientIp(httpRequest);
        authService.initiateOtp(request, ipAddress);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = getClientIp(httpRequest);

        OtpVerifyResponse response = authService.verifyOtp(request, deviceInfo, ipAddress);

        if (!response.isNewUser()) {
            ClientAuthResponse authResponse = authService.loginAfterOtp(
                    request.getPhone(), deviceInfo, ipAddress);
            return ResponseEntity.ok(authResponse);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup/complete")
    public ResponseEntity<ClientAuthResponse> completeProfile(
            @Valid @RequestBody ProfileCompleteRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = getClientIp(httpRequest);

        ClientAuthResponse response = authService.completeProfile(request, deviceInfo, ipAddress);
        return ResponseEntity.ok(response);
    }

    // ==================== Email/Password Authentication ====================

    @PostMapping("/register")
    public ResponseEntity<ClientAuthResponse> register(
            @Valid @RequestBody PasswordRegisterRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = getClientIp(httpRequest);

        ClientAuthResponse response = authService.registerWithPassword(request, deviceInfo, ipAddress);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody PasswordLoginRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = getClientIp(httpRequest);

        // Returns ClientAuthResponse normally, or TwoFactorChallengeResponse when 2FA is enabled
        Object response = authService.loginWithPassword(request, deviceInfo, ipAddress);
        return ResponseEntity.ok(response);
    }

    // ==================== Password Recovery ====================

    @PostMapping("/password/forgot")
    public ResponseEntity<Void> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        authService.initiateForgotPassword(request, ipAddress);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/password/verify-otp")
    public ResponseEntity<Map<String, String>> verifyPasswordResetOtp(
            @RequestBody Map<String, String> request) {

        String phone = request.get("phone");
        String email = request.get("email");
        String otp = request.get("otp");

        String resetToken;
        if (email != null && !email.isEmpty()) {
            // Email-based OTP verification
            resetToken = authService.verifyPasswordResetOtpByEmail(email, otp);
        } else if (phone != null && !phone.isEmpty()) {
            // Phone-based OTP verification
            resetToken = authService.verifyPasswordResetOtp(phone, otp);
        } else {
            throw new RuntimeException("Phone or email is required");
        }
        
        return ResponseEntity.ok(Map.of("resetToken", resetToken));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/password/change")
    public ResponseEntity<Void> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChangePasswordRequest request) {

        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);
        authService.changePassword(userId, request);
        return ResponseEntity.ok().build();
    }

    // ==================== Token Management ====================

    @PostMapping("/refresh")
    public ResponseEntity<ClientAuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = getClientIp(httpRequest);

        ClientAuthResponse response = authService.refreshToken(request, deviceInfo, ipAddress);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String accessToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring(7);
        }
        String refreshToken = (request != null) ? request.getRefreshToken() : null;
        authService.logout(refreshToken, accessToken);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);
        authService.logoutAll(userId);
        return ResponseEntity.ok().build();
    }

    // ==================== Profile ====================

    @GetMapping("/me")
    public ResponseEntity<ClientUserDto> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);
        ClientUserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<ClientUserDto> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UpdateProfileRequest request) {

        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);
        ClientUserDto user = authService.updateProfile(userId, request);
        return ResponseEntity.ok(user);
    }

    // ==================== Token Validation ====================

    @PostMapping("/validate")
    public ResponseEntity<TokenValidationResponse> validateToken(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");

        // Single JWT parse — extracts all claims in one shot
        Optional<Claims> claimsOpt = jwtService.extractValidClaims(token);

        TokenValidationResponse response = new TokenValidationResponse();
        response.setValid(claimsOpt.isPresent());

        claimsOpt.ifPresent(claims -> {
            response.setUserId(claims.getSubject());
            response.setPhone(claims.get("phone", String.class));
            response.setRole(claims.get("role", String.class));
            response.setType(claims.get("type", String.class));
        });

        return ResponseEntity.ok(response);
    }

    // ==================== Two-Factor Authentication ====================

    /** Step 1: generate TOTP secret and QR code URI. */
    @PostMapping("/2fa/setup")
    public ResponseEntity<com.volteryde.clientauth.dto.TwoFactorSetupResponse> setupTwoFactor(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);
        return ResponseEntity.ok(authService.setupTwoFactor(userId));
    }

    /** Step 2: confirm the first TOTP code to activate 2FA. */
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
    public ResponseEntity<com.volteryde.clientauth.dto.ClientAuthResponse> verifyTwoFactor(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = getClientIp(httpRequest);
        com.volteryde.clientauth.dto.ClientAuthResponse response =
                authService.verifyTwoFactor(request.get("challengeToken"), request.get("code"), deviceInfo, ipAddress);
        return ResponseEntity.ok(response);
    }

    // ==================== Email Verification ====================

    @PostMapping("/email/verify")
    public ResponseEntity<Void> verifyEmail(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);
        authService.verifyEmail(userId, request.get("otp"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/email/verify/resend")
    public ResponseEntity<Void> resendEmailVerification(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtService.extractUserId(token);
        authService.resendEmailVerification(userId);
        return ResponseEntity.ok().build();
    }

    // ==================== Social Login ====================

    /**
     * Austin: Google OAuth login with optional terms acceptance for new users.
     * If idToken is provided, it will be validated with Google's API.
     * Existing users are logged in directly; new users require terms acceptance.
     * Phone number is optional - included when user verified phone via OTP before Google OAuth.
     */
    @PostMapping("/social/google")
    public ResponseEntity<ClientAuthResponse> googleLogin(
            @RequestBody GoogleLoginRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = getClientIp(httpRequest);

        ClientAuthResponse response;
        
        // Use method with terms acceptance if provided
        if (request.getTermsAccepted() != null || request.getPrivacyAccepted() != null) {
            response = authService.googleLoginWithTerms(
                    request.getGoogleId(),
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    request.getIdToken(),
                    request.getPhone(), // Pass verified phone number if available
                    deviceInfo,
                    ipAddress,
                    Boolean.TRUE.equals(request.getTermsAccepted()),
                    Boolean.TRUE.equals(request.getPrivacyAccepted())
            );
        } else {
            // Fallback for existing users or when terms not provided
            response = authService.googleLogin(
                    request.getGoogleId(),
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    request.getIdToken(),
                    deviceInfo,
                    ipAddress
            );
        }

        return ResponseEntity.ok(response);
    }

    // ==================== Helpers ====================

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
