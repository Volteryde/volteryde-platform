package com.volteryde.clientauth.dto.sms;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for Gatekeeper Pro OTP generation.
 * 
 * Success Response:
 * {
 *   "message": "OTP generated successfully",
 *   "reference": "550e8400-e29b-41d4-a716-446655440000",
 *   "receiver": "+233241234567",
 *   "name": "John Doe",
 *   "type": "phone",
 *   "expiresAt": "2025-12-13T12:10:00.000Z",
 *   "otp": "123456"  // Only in development mode
 * }
 */
public class OtpGenerateResponse {

    private String message;
    
    private String reference;
    
    private String receiver;
    
    private String name;
    
    private String type;
    
    @JsonProperty("expiresAt")
    private String expiresAt;
    
    private String otp; // Only returned in development mode
    
    private String error; // For error responses

    public OtpGenerateResponse() {
    }

    public boolean isSuccess() {
        return error == null && reference != null;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(String expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
