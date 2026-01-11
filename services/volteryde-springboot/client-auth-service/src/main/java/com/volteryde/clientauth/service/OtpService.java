package com.volteryde.clientauth.service;

import com.volteryde.clientauth.dto.sms.OtpGenerateResponse;
import com.volteryde.clientauth.dto.sms.OtpVerifyResponse;
import com.volteryde.clientauth.entity.Otp;
import com.volteryde.clientauth.repository.OtpRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * OTP Service
 * 
 * Handles generation and verification of one-time passwords.
 * Uses Gatekeeper Pro API for OTP generation and verification (preferred).
 * Falls back to local generation if API is not configured.
 */
@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom random = new SecureRandom();

    private final OtpRepository otpRepository;
    private final SmsProviderService smsProviderService;

    @Value("${otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    @Value("${otp.length:6}")
    private int otpLength;

    @Value("${otp.use-external-provider:true}")
    private boolean useExternalProvider;

    public OtpService(OtpRepository otpRepository, SmsProviderService smsProviderService) {
        this.otpRepository = otpRepository;
        this.smsProviderService = smsProviderService;
    }

    /**
     * Generate OTP using Gatekeeper Pro external API.
     * This is the preferred method - handles both OTP generation and SMS delivery.
     * 
     * @param phone The phone number to send OTP to
     * @return OtpGenerateResponse with reference for later verification
     */
    @Transactional
    public OtpGenerateResponse generateOtpExternal(String phone) {
        logger.info("Generating OTP via Gatekeeper Pro for phone: {}", maskPhone(phone));
        
        // Invalidate any existing OTPs for this phone
        otpRepository.invalidateAllByPhone(phone);

        // Call external API to generate and send OTP
        OtpGenerateResponse response = smsProviderService.generateOtp(phone, otpLength);
        
        if (response != null && response.isSuccess()) {
            // Store the reference in local database for tracking
            Otp otp = new Otp();
            otp.setPhone(phone);
            otp.setExternalReference(response.getReference());
            otp.setReceiverName(response.getName());
            otp.setExternalProvider(true);
            
            // Parse expiration from response or use default 10 minutes
            if (response.getExpiresAt() != null && !response.getExpiresAt().isEmpty()) {
                try {
                    // Parse ISO 8601 datetime format from API response
                    otp.setExpiresAt(parseExpiresAt(response.getExpiresAt()));
                } catch (Exception e) {
                    logger.warn("Failed to parse expiresAt: {}, using default", response.getExpiresAt());
                    otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
                }
            } else {
                otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
            }
            
            otpRepository.save(otp);
            logger.info("OTP generated and stored for phone: {}. Reference: {}", 
                maskPhone(phone), response.getReference());
        } else {
            logger.error("Failed to generate OTP via external API for phone: {}", maskPhone(phone));
        }
        
        return response;
    }

    /**
     * Generate OTP using Gatekeeper Pro external API for email.
     * Similar to phone OTP but delivers via email.
     * 
     * @param email The email address to send OTP to
     * @return OtpGenerateResponse with reference for later verification
     */
    @Transactional
    public OtpGenerateResponse generateOtpExternalByEmail(String email) {
        logger.info("Generating OTP via Gatekeeper Pro for email: {}", maskEmail(email));
        
        // Invalidate any existing OTPs for this email
        otpRepository.invalidateAllByEmail(email);

        // Call external API to generate and send OTP via email
        OtpGenerateResponse response = smsProviderService.generateOtpByEmail(email, otpLength);
        
        if (response != null && response.isSuccess()) {
            // Store the reference in local database for tracking
            Otp otp = new Otp();
            otp.setEmail(email);
            otp.setExternalReference(response.getReference());
            otp.setReceiverName(response.getName());
            otp.setExternalProvider(true);
            
            // Parse expiration from response or use default 10 minutes
            if (response.getExpiresAt() != null && !response.getExpiresAt().isEmpty()) {
                try {
                    otp.setExpiresAt(parseExpiresAt(response.getExpiresAt()));
                } catch (Exception e) {
                    logger.warn("Failed to parse expiresAt: {}, using default", response.getExpiresAt());
                    otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
                }
            } else {
                otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
            }
            
            otpRepository.save(otp);
            logger.info("OTP generated and stored for email: {}. Reference: {}", 
                maskEmail(email), response.getReference());
        } else {
            logger.error("Failed to generate OTP via external API for email: {}", maskEmail(email));
        }
        
        return response;
    }

    /**
     * Verify OTP using Gatekeeper Pro external API for email.
     * Uses the stored reference to call the verify endpoint.
     * 
     * @param email The email address
     * @param code The OTP code entered by user
     * @return true if verification succeeded
     */
    @Transactional
    public boolean verifyOtpExternalByEmail(String email, String code) {
        logger.info("Verifying OTP via external API for email: {}", maskEmail(email));
        
        var optionalOtp = otpRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email);

        if (optionalOtp.isEmpty()) {
            logger.warn("No OTP record found for email: {}", maskEmail(email));
            return false;
        }

        Otp otp = optionalOtp.get();

        if (!otp.isValid()) {
            logger.warn("OTP record is invalid (expired or max attempts) for email: {}", maskEmail(email));
            return false;
        }

        // Check if this OTP uses external verification
        if (!otp.shouldUseExternalVerification()) {
            logger.warn("OTP for email {} does not have external reference", maskEmail(email));
            return false;
        }

        // Call external API to verify
        OtpVerifyResponse response = smsProviderService.verifyOtp(otp.getExternalReference(), code);
        
        if (response != null && response.isSuccess()) {
            // Mark as used
            otp.setUsed(true);
            otpRepository.save(otp);
            logger.info("OTP verified successfully via external API for email: {}", maskEmail(email));
            return true;
        } else {
            // Increment attempts
            otp.incrementAttempts();
            otpRepository.save(otp);
            logger.warn("OTP verification failed via external API for email: {}. Attempts: {}", 
                maskEmail(email), otp.getAttempts());
            return false;
        }
    }

    /**
     * Mask email for logging (shows first 2 chars and domain).
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIndex = email.indexOf("@");
        if (atIndex <= 2) return "***" + email.substring(atIndex);
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    /**
     * Parse expiresAt string from API response to LocalDateTime.
     * Handles ISO 8601 format: "2025-12-13T12:10:00.000Z"
     */
    private LocalDateTime parseExpiresAt(String expiresAtStr) {
        if (expiresAtStr == null || expiresAtStr.isEmpty()) {
            return LocalDateTime.now().plusMinutes(otpExpirationMinutes);
        }
        
        try {
            // Try ISO 8601 with Z suffix (UTC)
            if (expiresAtStr.endsWith("Z")) {
                return java.time.ZonedDateTime.parse(expiresAtStr)
                    .toLocalDateTime();
            }
            // Try standard ISO format
            return LocalDateTime.parse(expiresAtStr, 
                java.time.format.DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            logger.warn("Could not parse expiresAt '{}', using default expiration", expiresAtStr);
            return LocalDateTime.now().plusMinutes(otpExpirationMinutes);
        }
    }

    /**
     * Verify OTP using Gatekeeper Pro external API.
     * Uses the stored reference to call the verify endpoint.
     * 
     * @param phone The phone number
     * @param code The OTP code entered by user
     * @return true if verification succeeded
     */
    @Transactional
    public boolean verifyOtpExternal(String phone, String code) {
        logger.info("Verifying OTP via external API for phone: {}", maskPhone(phone));
        
        var optionalOtp = otpRepository.findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(phone);

        if (optionalOtp.isEmpty()) {
            logger.warn("No OTP record found for phone: {}", maskPhone(phone));
            return false;
        }

        Otp otp = optionalOtp.get();

        if (!otp.isValid()) {
            logger.warn("OTP record is invalid (expired or max attempts) for phone: {}", maskPhone(phone));
            return false;
        }

        // Check if this OTP uses external verification
        if (!otp.shouldUseExternalVerification()) {
            logger.info("Falling back to local verification for phone: {}", maskPhone(phone));
            return verifyOtpLocal(phone, code, otp);
        }

        // Call external API to verify
        OtpVerifyResponse response = smsProviderService.verifyOtp(otp.getExternalReference(), code);
        
        if (response != null && response.isSuccess()) {
            // Mark as used
            otp.setUsed(true);
            otpRepository.save(otp);
            logger.info("OTP verified successfully via external API for phone: {}", maskPhone(phone));
            return true;
        } else {
            // Increment attempts
            otp.incrementAttempts();
            otpRepository.save(otp);
            logger.warn("OTP verification failed via external API for phone: {}. Attempts: {}", 
                maskPhone(phone), otp.getAttempts());
            return false;
        }
    }

    /**
     * Local OTP verification (fallback when external API is not used).
     */
    private boolean verifyOtpLocal(String phone, String code, Otp otp) {
        if (!otp.getCode().equals(code)) {
            otp.incrementAttempts();
            otpRepository.save(otp);
            logger.warn("Invalid OTP attempt for phone: {}", maskPhone(phone));
            return false;
        }

        // Mark as used
        otp.setUsed(true);
        otpRepository.save(otp);
        logger.info("OTP verified successfully (local) for phone: {}", maskPhone(phone));
        return true;
    }

    /**
     * Generate and save a new OTP locally (fallback method).
     * Use generateOtpExternal() as the preferred method.
     */
    @Transactional
    public String generateOtp(String phone) {
        // Invalidate any existing OTPs for this phone
        otpRepository.invalidateAllByPhone(phone);

        // Generate new OTP
        String code = generateRandomCode();

        Otp otp = new Otp();
        otp.setPhone(phone);
        otp.setCode(code);
        otp.setExternalProvider(false);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes));

        otpRepository.save(otp);
        logger.info("Generated local OTP for phone: {}", maskPhone(phone));

        return code;
    }

    /**
     * Verify an OTP (main entry point - uses external or local based on config).
     */
    @Transactional
    public boolean verifyOtp(String phone, String code) {
        var optionalOtp = otpRepository.findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(phone);

        if (optionalOtp.isEmpty()) {
            logger.warn("No OTP found for phone: {}", maskPhone(phone));
            return false;
        }

        Otp otp = optionalOtp.get();

        if (!otp.isValid()) {
            logger.warn("OTP is invalid (expired or max attempts reached) for phone: {}", maskPhone(phone));
            return false;
        }

        // Use external verification if configured
        if (otp.shouldUseExternalVerification()) {
            return verifyOtpExternal(phone, code);
        }

        // Fall back to local verification
        return verifyOtpLocal(phone, code, otp);
    }

    /**
     * Generate a random numeric code
     */
    private String generateRandomCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    /**
     * Mask phone number for logging
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return phone.substring(0, 4) + "****" + phone.substring(phone.length() - 2);
    }

    /**
     * Send OTP via SMS using the external API.
     * This method generates the OTP externally and sends it in one call.
     * 
     * @param phone The phone number to send OTP to
     * @return true if OTP was generated and sent successfully
     */
    public boolean sendOtpSms(String phone) {
        logger.info("Sending OTP to phone: {}", maskPhone(phone));
        
        // Check if SMS provider is configured
        if (!smsProviderService.isConfigured()) {
            logger.warn("SMS provider is not configured. Using local OTP generation.");
            String code = generateOtp(phone);
            logger.debug("OTP for {}: {}", phone, code);
            return true; // Return true for development mode
        }
        
        try {
            // Use external API to generate and send OTP
            OtpGenerateResponse response = generateOtpExternal(phone);
            
            if (response != null && response.isSuccess()) {
                logger.info("OTP generated and sent via Gatekeeper Pro to phone: {}", maskPhone(phone));
                return true;
            } else {
                String errorMsg = response != null ? response.getError() : "Unknown error";
                logger.error("Failed to generate/send OTP via external API: {}", errorMsg);
                return false;
            }
        } catch (Exception e) {
            logger.error("Exception while generating/sending OTP: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Legacy method - now calls sendOtpSms(phone) internally.
     * 
     * @deprecated Use {@link #sendOtpSms(String)} instead
     */
    @Deprecated
    public boolean sendOtpSms(String phone, String code) {
        logger.info("Legacy sendOtpSms called - using new external API method");
        return sendOtpSms(phone);
    }

    /**
     * Check if SMS provider is properly configured.
     */
    public boolean isSmsProviderConfigured() {
        return smsProviderService.isConfigured();
    }

    /**
     * Check if external OTP provider is enabled.
     */
    public boolean isExternalProviderEnabled() {
        return useExternalProvider && smsProviderService.isConfigured();
    }
}
