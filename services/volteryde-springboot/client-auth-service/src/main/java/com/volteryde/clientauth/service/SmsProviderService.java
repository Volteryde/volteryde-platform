package com.volteryde.clientauth.service;

import com.volteryde.clientauth.dto.sms.OtpGenerateRequest;
import com.volteryde.clientauth.dto.sms.OtpGenerateResponse;
import com.volteryde.clientauth.dto.sms.OtpVerifyRequest;
import com.volteryde.clientauth.dto.sms.OtpVerifyResponse;
import com.volteryde.clientauth.dto.sms.SmsSendRequest;
import com.volteryde.clientauth.dto.sms.SmsSendResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for OTP generation and SMS via Gatekeeper Pro API.
 * 
 * This service integrates with the Gatekeeper Pro API for:
 * 1. OTP Generation - POST /api/generate_otp (generates OTP and sends SMS automatically)
 * 2. OTP Verification - POST /api/verify_otp (verifies OTP using reference)
 * 3. SMS Sending - POST /api/send_sms (for custom messages)
 * 
 * OTP API Features:
 * - 6-digit OTP codes by default
 * - 10-minute expiration
 * - Auto name resolution for phone numbers
 * - USSD fallback: *713*882#
 * 
 * @author Volteryde Team
 */
@Service
public class SmsProviderService {

    private static final Logger logger = LoggerFactory.getLogger(SmsProviderService.class);

    private final RestTemplate restTemplate;

    @Value("${sms.provider.api-url:https://api.gatekeeperpro.live}")
    private String apiUrl;

    @Value("${sms.provider.api-key}")
    private String apiKey;

    @Value("${sms.provider.sender-name:Volteryde}")
    private String senderName;

    @Value("${sms.provider.project-name:Volteryde}")
    private String projectName;

    public SmsProviderService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Generates an OTP and sends it via SMS using Gatekeeper Pro API.
     * This is the preferred method - it handles both OTP generation and SMS sending in one call.
     * 
     * @param phoneNumber The phone number to send the OTP to (format: 233xxxxxxxxx or +233xxxxxxxxx)
     * @param otpSize The size of the OTP code (default is 6)
     * @return OtpGenerateResponse containing the reference UUID for later verification
     */
    public OtpGenerateResponse generateOtp(String phoneNumber, int otpSize) {
        String endpoint = apiUrl + "/api/generate_otp";
        
        // Format phone number (remove + if present, API expects 233xxxxxxxxx format)
        String formattedPhone = formatPhoneNumber(phoneNumber);
        
        logger.info("Generating OTP for phone: {}", maskPhone(formattedPhone));

        try {
            HttpHeaders headers = createHeaders();
            
            OtpGenerateRequest request = new OtpGenerateRequest();
            request.setProject(projectName);
            request.setPhoneNumber(formattedPhone);
            request.setSize(otpSize);
            
            // Add extra metadata
            Map<String, Object> extra = new HashMap<>();
            extra.put("source", "client-auth-service");
            extra.put("type", "verification");
            request.setExtra(extra);

            HttpEntity<OtpGenerateRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<OtpGenerateResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                OtpGenerateResponse.class
            );

            OtpGenerateResponse responseBody = response.getBody();
            
            if (responseBody != null) {
                logger.debug("OTP Generate API response: message={}, reference={}, receiver={}", 
                    responseBody.getMessage(),
                    responseBody.getReference(),
                    responseBody.getReceiver());
                
                if (responseBody.isSuccess()) {
                    logger.info("OTP generated and sent successfully to phone: {}. Reference: {}", 
                        maskPhone(formattedPhone), responseBody.getReference());
                } else {
                    logger.error("Failed to generate OTP: {}", responseBody.getError());
                }
            }

            return responseBody;

        } catch (RestClientException e) {
            logger.error("Error calling OTP generate API: {}", e.getMessage(), e);
            
            OtpGenerateResponse errorResponse = new OtpGenerateResponse();
            errorResponse.setError("Failed to connect to OTP provider: " + e.getMessage());
            return errorResponse;
        }
    }

    /**
     * Generates a 6-digit OTP (default size).
     * 
     * @param phoneNumber The phone number to send the OTP to
     * @return OtpGenerateResponse containing the reference UUID
     */
    public OtpGenerateResponse generateOtp(String phoneNumber) {
        return generateOtp(phoneNumber, 6);
    }

    /**
     * Generates an OTP and sends it via Email using Gatekeeper Pro API.
     * Similar to phone OTP but uses email as the delivery channel.
     * 
     * @param email The email address to send the OTP to
     * @param otpSize The size of the OTP code (default is 6)
     * @return OtpGenerateResponse containing the reference UUID for later verification
     */
    public OtpGenerateResponse generateOtpByEmail(String email, int otpSize) {
        String endpoint = apiUrl + "/api/generate_otp";
        
        logger.info("Generating OTP for email: {}", maskEmail(email));

        try {
            HttpHeaders headers = createHeaders();
            
            OtpGenerateRequest request = new OtpGenerateRequest();
            request.setProject(projectName);
            request.setEmail(email);  // Use email instead of phone
            request.setSize(otpSize);
            
            // Add extra metadata
            Map<String, Object> extra = new HashMap<>();
            extra.put("source", "client-auth-service");
            extra.put("type", "password-reset");
            request.setExtra(extra);

            HttpEntity<OtpGenerateRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<OtpGenerateResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                OtpGenerateResponse.class
            );

            OtpGenerateResponse responseBody = response.getBody();
            
            if (responseBody != null) {
                logger.debug("OTP Generate (email) API response: message={}, reference={}, receiver={}", 
                    responseBody.getMessage(),
                    responseBody.getReference(),
                    responseBody.getReceiver());
                
                if (responseBody.isSuccess()) {
                    logger.info("OTP generated and sent successfully to email: {}. Reference: {}", 
                        maskEmail(email), responseBody.getReference());
                } else {
                    logger.error("Failed to generate email OTP: {}", responseBody.getError());
                }
            }

            return responseBody;

        } catch (RestClientException e) {
            logger.error("Error calling OTP generate API for email: {}", e.getMessage(), e);
            
            OtpGenerateResponse errorResponse = new OtpGenerateResponse();
            errorResponse.setError("Failed to connect to OTP provider: " + e.getMessage());
            return errorResponse;
        }
    }

    /**
     * Generates a 6-digit OTP for email (default size).
     * 
     * @param email The email address to send the OTP to
     * @return OtpGenerateResponse containing the reference UUID
     */
    public OtpGenerateResponse generateOtpByEmail(String email) {
        return generateOtpByEmail(email, 6);
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
     * Verifies an OTP using the reference UUID from the generate response.
     * 
     * @param reference The reference UUID returned from generateOtp
     * @param otpCode The OTP code entered by the user
     * @return OtpVerifyResponse indicating whether verification succeeded
     */
    public OtpVerifyResponse verifyOtp(String reference, String otpCode) {
        String endpoint = apiUrl + "/api/verify_otp";
        
        logger.info("Verifying OTP for reference: {}", reference);

        try {
            HttpHeaders headers = createHeaders();
            
            OtpVerifyRequest request = new OtpVerifyRequest(reference, otpCode);
            HttpEntity<OtpVerifyRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<OtpVerifyResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                OtpVerifyResponse.class
            );

            OtpVerifyResponse responseBody = response.getBody();
            
            if (responseBody != null) {
                logger.debug("OTP Verify API response: verified={}, message={}, attemptsRemaining={}", 
                    responseBody.getVerified(),
                    responseBody.getMessage(),
                    responseBody.getAttemptsRemaining());
                
                if (responseBody.isSuccess()) {
                    logger.info("OTP verified successfully for reference: {}", reference);
                } else {
                    logger.warn("OTP verification failed for reference: {}. Attempts remaining: {}", 
                        reference, responseBody.getAttemptsRemaining());
                }
            }

            return responseBody;

        } catch (RestClientException e) {
            logger.error("Error calling OTP verify API: {}", e.getMessage(), e);
            
            OtpVerifyResponse errorResponse = new OtpVerifyResponse();
            errorResponse.setVerified(false);
            errorResponse.setError("Failed to connect to OTP provider: " + e.getMessage());
            return errorResponse;
        }
    }

    /**
     * Sends an SMS with the OTP code to the specified phone number.
     * 
     * @deprecated Use {@link #generateOtp(String)} instead which handles both OTP generation and SMS.
     * @param phoneNumber The phone number to send the OTP to (format: 233xxxxxxxxx or +233xxxxxxxxx)
     * @param otpCode The OTP code to include in the message
     * @param expirationMinutes How many minutes the OTP is valid for
     * @return SmsSendResponse containing success status and credits used
     */
    @Deprecated
    public SmsSendResponse sendOtp(String phoneNumber, String otpCode, int expirationMinutes) {
        String endpoint = apiUrl + "/api/send_sms";
        
        // Format phone number (remove + if present, API expects 233xxxxxxxxx format)
        String formattedPhone = formatPhoneNumber(phoneNumber);
        
        // Create OTP message
        String message = String.format("Your %s verification code is: %s. Valid for %d minutes. Do not share this code.", 
            senderName, otpCode, expirationMinutes);
        
        logger.info("Sending OTP SMS to phone: {}", maskPhone(formattedPhone));

        try {
            HttpHeaders headers = createHeaders();
            
            SmsSendRequest request = new SmsSendRequest(formattedPhone, message);

            HttpEntity<SmsSendRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<SmsSendResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                SmsSendResponse.class
            );

            SmsSendResponse responseBody = response.getBody();
            
            // Log the raw response for debugging
            logger.debug("SMS API response: success={}, message={}, credits={}", 
                responseBody != null ? responseBody.getSuccess() : "null",
                responseBody != null ? responseBody.getMessage() : "null",
                responseBody != null ? responseBody.getCreditsUsed() : "null");
            
            // Check for success - either explicit success=true OR message contains "successfully"
            boolean isSuccess = responseBody != null && (
                Boolean.TRUE.equals(responseBody.getSuccess()) || 
                (responseBody.getMessage() != null && responseBody.getMessage().toLowerCase().contains("successfully"))
            );
            
            if (isSuccess) {
                logger.info("OTP SMS sent successfully to phone: {}. Credits used: {}", 
                    maskPhone(formattedPhone), responseBody.getCreditsUsed());
                // Ensure success flag is set for caller
                responseBody.setSuccess(true);
            } else {
                String errorMsg = responseBody != null ? responseBody.getMessage() : "Unknown error";
                logger.error("Failed to send OTP SMS: {}", errorMsg);
            }

            return responseBody;

        } catch (RestClientException e) {
            logger.error("Error calling SMS provider API: {}", e.getMessage(), e);
            
            SmsSendResponse errorResponse = new SmsSendResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Failed to connect to SMS provider: " + e.getMessage());
            return errorResponse;
        }
    }

    /**
     * Sends a custom SMS message to the specified phone number.
     * 
     * @param phoneNumber The phone number to send to
     * @param message The message content
     * @return SmsSendResponse containing success status
     */
    public SmsSendResponse sendSms(String phoneNumber, String message) {
        String endpoint = apiUrl + "/api/send_sms";
        
        String formattedPhone = formatPhoneNumber(phoneNumber);
        
        logger.info("Sending SMS to phone: {}", maskPhone(formattedPhone));

        try {
            HttpHeaders headers = createHeaders();
            
            SmsSendRequest request = new SmsSendRequest(formattedPhone, message);
            HttpEntity<SmsSendRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<SmsSendResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                SmsSendResponse.class
            );

            SmsSendResponse responseBody = response.getBody();
            
            if (responseBody != null && Boolean.TRUE.equals(responseBody.getSuccess())) {
                logger.info("SMS sent successfully to phone: {}", maskPhone(formattedPhone));
            } else {
                String errorMsg = responseBody != null ? responseBody.getMessage() : "Unknown error";
                logger.error("Failed to send SMS: {}", errorMsg);
            }

            return responseBody;

        } catch (RestClientException e) {
            logger.error("Error sending SMS: {}", e.getMessage(), e);
            
            SmsSendResponse errorResponse = new SmsSendResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("Failed to send SMS: " + e.getMessage());
            return errorResponse;
        }
    }

    /**
     * Creates HTTP headers with the required X-API-Key.
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", apiKey);
        return headers;
    }

    /**
     * Formats phone number for the API (expects 233xxxxxxxxx format).
     * Handles various input formats: +233xxx, 233xxx, 0xxx
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null) {
            return phone;
        }
        
        // Remove any spaces, dashes, or other characters
        String cleaned = phone.replaceAll("[^0-9+]", "");
        
        // Remove leading + if present
        if (cleaned.startsWith("+")) {
            cleaned = cleaned.substring(1);
        }
        
        // If starts with 0, assume Ghana number and replace with 233
        if (cleaned.startsWith("0")) {
            cleaned = "233" + cleaned.substring(1);
        }
        
        return cleaned;
    }

    /**
     * Masks phone number for logging (shows first 4 and last 2 digits).
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) {
            return "****";
        }
        return phone.substring(0, 4) + "****" + phone.substring(phone.length() - 2);
    }

    /**
     * Checks if the SMS provider is properly configured.
     */
    public boolean isConfigured() {
        return apiKey != null 
            && !apiKey.isEmpty() 
            && !apiKey.equals("your-api-key-here");
    }
}
