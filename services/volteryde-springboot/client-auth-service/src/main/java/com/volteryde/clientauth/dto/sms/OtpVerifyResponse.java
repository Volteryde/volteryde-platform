package com.volteryde.clientauth.dto.sms;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for Gatekeeper Pro OTP verification.
 * 
 * API Response fields:
 * - message: Status message
 * - reference: OTP reference UUID
 * - receiver: Phone number that received OTP
 * - name: Resolved receiver name (from auto-lookup)
 * - verified: Whether the OTP was verified successfully
 * - error: Error message if failed
 * - attemptsRemaining: Number of verification attempts left
 */
public class OtpVerifyResponse {

    private String message;
    private String reference;
    private String receiver;
    private String name;
    private Boolean verified;
    private String error;
    
    @JsonProperty("attempts_remaining")
    private Integer attemptsRemaining;

    public OtpVerifyResponse() {
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

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Integer getAttemptsRemaining() {
        return attemptsRemaining;
    }

    public void setAttemptsRemaining(Integer attemptsRemaining) {
        this.attemptsRemaining = attemptsRemaining;
    }

    /**
     * Check if the OTP verification was successful.
     */
    public boolean isSuccess() {
        return verified != null && verified && error == null;
    }
}
