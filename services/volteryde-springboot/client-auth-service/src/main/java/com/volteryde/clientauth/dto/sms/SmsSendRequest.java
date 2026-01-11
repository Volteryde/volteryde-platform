package com.volteryde.clientauth.dto.sms;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request DTO for sending SMS via the SMS provider API.
 * 
 * API: POST /api/send_sms
 * 
 * Required fields:
 * - phoneNumber: The recipient phone number (format: 233241234567)
 * - message: The SMS message content
 */
public class SmsSendRequest {

    @JsonProperty("phoneNumber")
    private String phoneNumber;

    @JsonProperty("message")
    private String message;

    public SmsSendRequest() {
    }

    public SmsSendRequest(String phoneNumber, String message) {
        this.phoneNumber = phoneNumber;
        this.message = message;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
