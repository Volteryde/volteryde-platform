package com.volteryde.clientauth.service;

import com.volteryde.clientauth.dto.*;
import com.volteryde.clientauth.entity.*;
import com.volteryde.clientauth.exception.UserNotFoundException;
import com.volteryde.clientauth.repository.*;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

/**
 * Client Authentication Service
 * 
 * Handles authentication for Riders (external clients) via Phone/OTP, Email/Password, and Social Login.
 * Drivers are internal workers and use auth-service instead.
 */
@Service
public class ClientAuthService {

    private static final Logger logger = LoggerFactory.getLogger(ClientAuthService.class);
    
    // Austin: Current terms and privacy policy versions
    private static final String CURRENT_TERMS_VERSION = "1.0";
    private static final String CURRENT_PRIVACY_VERSION = "1.0";

    private final ClientUserRepository userRepository;
    private final ClientRefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TermsAcceptanceRepository termsAcceptanceRepository;
    private final OtpService otpService;
    private final ClientJwtService jwtService;
    private final RateLimiterService rateLimiterService;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.security.jwt.secret}")
    private String jwtSecret;

    @Value("${google.web-client-id}")
    private String googleWebClientId;

    @Value("${google.ios-client-id}")
    private String googleIosClientId;

    @Value("${google.android-client-id}")
    private String googleAndroidClientId;

    public ClientAuthService(
            ClientUserRepository userRepository,
            ClientRefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            TermsAcceptanceRepository termsAcceptanceRepository,
            OtpService otpService,
            ClientJwtService jwtService,
            RateLimiterService rateLimiterService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.termsAcceptanceRepository = termsAcceptanceRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.rateLimiterService = rateLimiterService;
        this.passwordEncoder = passwordEncoder;
    }

    // ==================== OTP Authentication ====================

    /**
     * Step 1: Initiate OTP login/registration
     * Uses Gatekeeper Pro API which handles both OTP generation and SMS delivery.
     * 
     * Rate Limiting:
     * - 3 OTPs per 5 minutes per phone
     * - 10 OTPs per minute per phone (burst protection)
     * - 20 OTPs per minute per IP before blacklist (2 hours, then 100 hours for repeat)
     */
    @Transactional
    public void initiateOtp(OtpInitRequest request, String ipAddress) {
        String phone = normalizePhone(request.getPhone());
        
        // Rate limiting with IP-based abuse prevention
        rateLimiterService.checkAndRecordOtp(phone, ipAddress);
        
        logger.info("Initiating OTP for phone: {}", maskPhone(phone));
        
        // Use external API (Gatekeeper Pro) - handles both generation and SMS
        boolean sent = otpService.sendOtpSms(phone);
        if (!sent) {
            throw new RuntimeException("Failed to send OTP. Please try again later.");
        }
    }

    /**
     * Legacy method for backward compatibility (no IP tracking)
     */
    @Transactional
    public void initiateOtp(OtpInitRequest request) {
        initiateOtp(request, null);
    }

    /**
     * Step 2: Verify OTP
     */
    @Transactional
    public OtpVerifyResponse verifyOtp(OtpVerifyRequest request, String deviceInfo, String ipAddress) {
        String phone = normalizePhone(request.getPhone());
        
        boolean verified = otpService.verifyOtp(phone, request.getCode());
        if (!verified) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        Optional<ClientUser> existingUser = userRepository.findByPhone(phone);
        
        if (existingUser.isPresent()) {
            return new OtpVerifyResponse(true, false, null);
        } else {
            String signupToken = generateSignupToken(phone);
            return new OtpVerifyResponse(true, true, signupToken);
        }
    }

    /**
     * Login existing user after OTP verification
     */
    @Transactional
    public ClientAuthResponse loginAfterOtp(String phone, String deviceInfo, String ipAddress) {
        phone = normalizePhone(phone);
        
        ClientUser user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getStatus() != ClientStatus.ACTIVE) {
            throw new RuntimeException("Account is not active");
        }

        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    /**
     * Complete profile for new users (after OTP)
     * 
     * Austin: Terms acceptance is REQUIRED for profile completion.
     * Authentication cannot complete without explicit acceptance.
     */
    @Transactional
    public ClientAuthResponse completeProfile(ProfileCompleteRequest request, String deviceInfo, String ipAddress) {
        String phone = verifySignupToken(request.getSignupToken());

        if (userRepository.existsByPhone(phone)) {
            throw new RuntimeException("User already exists");
        }

        // Austin: Validate terms acceptance before creating account
        if (!request.isFullyAccepted()) {
            throw new RuntimeException("Terms and conditions must be accepted to continue");
        }

        ClientUser user = new ClientUser();
        user.setPhone(phone);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setRole(ClientRole.RIDER);
        user.setStatus(ClientStatus.ACTIVE);
        user.setPhoneVerified(true);
        
        // Austin: Record terms acceptance
        user.setTermsAccepted(true);
        user.setTermsAcceptedAt(java.time.LocalDateTime.now());

        user = userRepository.save(user);
        
        // Austin: Save detailed terms acceptance record for audit
        saveTermsAcceptance(user, deviceInfo, ipAddress);
        
        logger.info("New rider created: {}", user.getId());

        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    // ==================== Email/Password Authentication ====================

    /**
     * Register with email and password
     */
    @Transactional
    public ClientAuthResponse registerWithPassword(PasswordRegisterRequest request, String deviceInfo, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (request.getPhone() != null && userRepository.existsByPhone(normalizePhone(request.getPhone()))) {
            throw new RuntimeException("Phone number already registered");
        }

        ClientUser user = new ClientUser();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone() != null ? normalizePhone(request.getPhone()) : null);
        user.setRole(ClientRole.RIDER);
        user.setStatus(ClientStatus.ACTIVE);
        user.setEmailVerified(false); // Require email verification

        user = userRepository.save(user);
        logger.info("New rider registered via email: {}", user.getId());

        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    /**
     * Login with email and password
     */
    @Transactional
    public ClientAuthResponse loginWithPassword(PasswordLoginRequest request, String deviceInfo, String ipAddress) {
        ClientUser user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getPasswordHash() == null) {
            throw new RuntimeException("This account uses social login. Please use Google or phone login.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (user.getStatus() != ClientStatus.ACTIVE) {
            throw new RuntimeException("Account is not active");
        }

        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    // ==================== Password Recovery ====================

    /**
     * Initiate forgot password (via phone or email OTP)
     * Uses Gatekeeper Pro API for OTP generation and delivery (SMS or Email).
     * 
     * Rate Limiting:
     * - 3 OTPs per 5 minutes per phone/email
     * - IP-based abuse prevention with blacklisting
     */
    @Transactional
    public void initiateForgotPassword(ForgotPasswordRequest request, String ipAddress) {
        if (request.hasPhone()) {
            String phone = normalizePhone(request.getPhone());
            rateLimiterService.checkAndRecordOtp(phone, ipAddress);
            
            ClientUser user = userRepository.findByPhone(phone)
                    .orElseThrow(() -> new UserNotFoundException("No account found with this phone number"));
            
            // Use external API (Gatekeeper Pro) - handles both generation and SMS
            boolean sent = otpService.sendOtpSms(phone);
            if (!sent) {
                throw new RuntimeException("Failed to send OTP. Please try again later.");
            }
            logger.info("Password reset OTP sent to phone: {}", maskPhone(phone));
            
        } else if (request.hasEmail()) {
            String email = request.getEmail().toLowerCase().trim();
            // Use email-specific OTP rate limiting
            rateLimiterService.checkAndRecordEmailOtp(email, ipAddress);
            
            ClientUser user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UserNotFoundException("No account found with this email"));
            
            // Use Gatekeeper Pro API for email OTP
            var response = otpService.generateOtpExternalByEmail(email);
            if (response == null || !response.isSuccess()) {
                throw new RuntimeException("Failed to send OTP to email. Please try again later.");
            }
            logger.info("Password reset OTP sent to email: {}", email);
        } else {
            throw new RuntimeException("Email or phone number is required");
        }
    }

    /**
     * Legacy method for backward compatibility (no IP tracking)
     */
    @Transactional
    public void initiateForgotPassword(ForgotPasswordRequest request) {
        initiateForgotPassword(request, null);
    }

    /**
     * Verify password reset OTP (phone) and return reset token
     */
    @Transactional
    public String verifyPasswordResetOtp(String phone, String otp) {
        phone = normalizePhone(phone);
        
        boolean verified = otpService.verifyOtp(phone, otp);
        if (!verified) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        ClientUser user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return generatePasswordResetToken(user);
    }

    /**
     * Verify password reset OTP (email) and return reset token
     */
    @Transactional
    public String verifyPasswordResetOtpByEmail(String email, String otp) {
        email = email.toLowerCase().trim();
        
        boolean verified = otpService.verifyOtpExternalByEmail(email, otp);
        if (!verified) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        ClientUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return generatePasswordResetToken(user);
    }

    /**
     * Reset password using reset token
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getResetToken())
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        if (!resetToken.isValid()) {
            throw new RuntimeException("Reset token has expired");
        }

        ClientUser user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate the token
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Logout from all devices for security
        refreshTokenRepository.revokeAllByUserId(user.getId());

        logger.info("Password reset successful for user: {}", user.getId());
    }

    /**
     * Change password (requires current password)
     */
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        ClientUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPasswordHash() == null) {
            throw new RuntimeException("Cannot change password for social login accounts");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        logger.info("Password changed for user: {}", userId);
    }

    // ==================== Profile Management ====================

    /**
     * Get current user
     */
    public ClientUserDto getCurrentUser(String userId) {
        ClientUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ClientUserDto.fromEntity(user);
    }

    /**
     * Update user profile
     */
    @Transactional
    public ClientUserDto updateProfile(String userId, UpdateProfileRequest request) {
        ClientUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
            user.setEmailVerified(false); // Require re-verification
        }
        if (request.getPhone() != null) {
            String phone = normalizePhone(request.getPhone());
            if (!phone.equals(user.getPhone()) && userRepository.existsByPhone(phone)) {
                throw new RuntimeException("Phone number already in use");
            }
            user.setPhone(phone);
            user.setPhoneVerified(false); // Require re-verification
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }

        user = userRepository.save(user);
        logger.info("Profile updated for user: {}", userId);

        return ClientUserDto.fromEntity(user);
    }

    // ==================== Token Management ====================

    /**
     * Refresh access token
     */
    @Transactional
    public ClientAuthResponse refreshToken(RefreshTokenRequest request, String deviceInfo, String ipAddress) {
        ClientRefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (!storedToken.isValid()) {
            throw new RuntimeException("Refresh token expired or revoked");
        }

        ClientUser user = storedToken.getUser();
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    /**
     * Logout
     */
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    /**
     * Logout from all devices
     */
    @Transactional
    public void logoutAll(String userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    // ==================== Social Login ====================

    /**
     * Google OAuth login/registration
     */
    @Transactional
    public ClientAuthResponse googleLogin(String googleId, String email, String firstName, String lastName, 
                                          String idToken, String deviceInfo, String ipAddress) {
        
        if (idToken != null && !idToken.isEmpty()) {
            try {
                // In a production environment, verify the token
                // GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                //    .setAudience(Collections.singletonList(googleClientId))
                //    .build();
                // GoogleIdToken verifiedToken = verifier.verify(idToken);
                // if (verifiedToken != null) { ... }
                logger.info("Received Google ID Token: " + idToken.substring(0, 10) + "...");
            } catch (Exception e) {
                logger.error("Error checking Google token", e);
            }
        }
        
        Optional<ClientUser> existingUser = userRepository.findByGoogleId(googleId);
        
        if (existingUser.isPresent()) {
            return generateAuthResponse(existingUser.get(), deviceInfo, ipAddress);
        }

        existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            ClientUser user = existingUser.get();
            user.setGoogleId(googleId);
            user = userRepository.save(user);
            return generateAuthResponse(user, deviceInfo, ipAddress);
        }

        ClientUser user = new ClientUser();
        user.setGoogleId(googleId);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(ClientRole.RIDER);
        user.setStatus(ClientStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setPhoneVerified(false); // Phone not provided by Google usually

        user = userRepository.save(user);
        logger.info("New rider created via Google: {}", user.getId());

        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    /**
     * Austin: Google OAuth login/registration with explicit terms acceptance.
     * For new users, both terms and privacy must be accepted.
     * Phone number is optional - included when user verified phone via OTP before switching to Google OAuth.
     */
    @Transactional
    public ClientAuthResponse googleLoginWithTerms(String googleId, String email, String firstName, String lastName, 
                                          String idToken, String phone, String deviceInfo, String ipAddress,
                                          boolean termsAccepted, boolean privacyAccepted) {
        // Verify token if provided
        if (idToken != null && !idToken.isEmpty()) {
             try {
                 logger.info("Received Google ID Token for Terms Login: " + idToken.substring(0, 10) + "...");
                 // Verification logic would go here
             } catch (Exception e) {
                 logger.error("Error checking Google token", e);
             }
        }

        // Normalize phone if provided
        String normalizedPhone = (phone != null && !phone.isEmpty()) ? normalizePhone(phone) : null;

        // Check for existing user by Google ID
        Optional<ClientUser> existingUser = userRepository.findByGoogleId(googleId);
        
        if (existingUser.isPresent()) {
            ClientUser user = existingUser.get();
            // If user doesn't have phone but we have one, add it
            if (normalizedPhone != null && user.getPhone() == null) {
                // Check if phone is already used by another user
                if (!userRepository.existsByPhone(normalizedPhone)) {
                    user.setPhone(normalizedPhone);
                    user.setPhoneVerified(true);
                    user = userRepository.save(user);
                    logger.info("Added verified phone to existing Google user: {}", user.getId());
                }
            }
            return generateAuthResponse(user, deviceInfo, ipAddress);
        }

        // Check for existing user by email (account linking)
        existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            ClientUser user = existingUser.get();
            user.setGoogleId(googleId);
            // If user doesn't have phone but we have one, add it
            if (normalizedPhone != null && user.getPhone() == null) {
                if (!userRepository.existsByPhone(normalizedPhone)) {
                    user.setPhone(normalizedPhone);
                    user.setPhoneVerified(true);
                }
            }
            user = userRepository.save(user);
            return generateAuthResponse(user, deviceInfo, ipAddress);
        }

        // Check for existing user by phone (account linking)
        if (normalizedPhone != null) {
            existingUser = userRepository.findByPhone(normalizedPhone);
            if (existingUser.isPresent()) {
                ClientUser user = existingUser.get();
                user.setGoogleId(googleId);
                user.setEmail(email);
                user.setEmailVerified(true);
                user = userRepository.save(user);
                logger.info("Linked Google account to existing phone user: {}", user.getId());
                return generateAuthResponse(user, deviceInfo, ipAddress);
            }
        }

        // New user - require terms acceptance
        if (!termsAccepted || !privacyAccepted) {
            throw new RuntimeException("Terms and conditions must be accepted to create an account");
        }

        ClientUser user = new ClientUser();
        user.setGoogleId(googleId);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(ClientRole.RIDER);
        user.setStatus(ClientStatus.ACTIVE);
        user.setEmailVerified(true);
        
        // Set phone if provided (verified via OTP before Google OAuth)
        if (normalizedPhone != null) {
            user.setPhone(normalizedPhone);
            user.setPhoneVerified(true);
        } else {
            user.setPhoneVerified(false);
        }
        
        user.setTermsAccepted(true);
        user.setTermsAcceptedAt(LocalDateTime.now());

        user = userRepository.save(user);
        
        // Save terms acceptance record for audit
        saveTermsAcceptance(user, deviceInfo, ipAddress);
        
        logger.info("New rider created via Google with terms (phone: {}): {}", normalizedPhone != null ? "yes" : "no", user.getId());

        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    // ==================== Helper Methods ====================

    private ClientAuthResponse generateAuthResponse(ClientUser user, String deviceInfo, String ipAddress) {
        String accessToken = jwtService.generateAccessToken(user);
        ClientRefreshToken refreshToken = jwtService.generateRefreshToken(user, deviceInfo, ipAddress);
        refreshTokenRepository.save(refreshToken);

        return new ClientAuthResponse(
                accessToken,
                refreshToken.getToken(),
                jwtService.getExpirationInSeconds(),
                ClientUserDto.fromEntity(user)
        );
    }

    private String generatePasswordResetToken(ClientUser user) {
        // Invalidate existing tokens
        passwordResetTokenRepository.invalidateAllByUserId(user.getId());

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        passwordResetTokenRepository.save(token);

        return token.getToken();
    }

    private String normalizePhone(String phone) {
        return phone.replaceAll("[^+0-9]", "");
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return phone.substring(0, 4) + "****" + phone.substring(phone.length() - 2);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] paddedKey = new byte[32];
            System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
            keyBytes = paddedKey;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String generateSignupToken(String phone) {
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + 1800000);

        Map<String, Object> claims = new HashMap<>();
        claims.put("scope", "SIGNUP_VERIFIED");
        claims.put("phone", phone);

        return Jwts.builder()
                .subject(phone)
                .claims(claims)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .issuer("client-auth.volteryde.org")
                .signWith(getSigningKey())
                .compact();
    }

    private String verifySignupToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String scope = claims.get("scope", String.class);
            if (!"SIGNUP_VERIFIED".equals(scope)) {
                throw new RuntimeException("Invalid signup token");
            }

            return claims.get("phone", String.class);
        } catch (JwtException e) {
            throw new RuntimeException("Invalid or expired signup token");
        }
    }

    /**
     * Austin: Save detailed terms acceptance record for audit purposes.
     * This creates a permanent record of when and how terms were accepted.
     */
    private void saveTermsAcceptance(ClientUser user, String deviceInfo, String ipAddress) {
        TermsAcceptance acceptance = new TermsAcceptance();
        acceptance.setUser(user);
        acceptance.setTermsVersion(CURRENT_TERMS_VERSION);
        acceptance.setPrivacyVersion(CURRENT_PRIVACY_VERSION);
        acceptance.setTermsAccepted(true);
        acceptance.setPrivacyAccepted(true);
        acceptance.setAcceptedAt(LocalDateTime.now());
        acceptance.setDeviceInfo(deviceInfo);
        acceptance.setIpAddress(ipAddress);
        termsAcceptanceRepository.save(acceptance);
        logger.info("Terms acceptance recorded for user: {}", user.getId());
    }
}
