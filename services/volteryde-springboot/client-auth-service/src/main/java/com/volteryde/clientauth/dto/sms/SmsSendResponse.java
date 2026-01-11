package com.volteryde.clientauth.dto.sms;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for SMS send API.
 * 
 * API Response:
 * {
 *   "success": true,
 *   "message": "SMS sent successfully",
 *   "creditsUsed": 1
 * }
 */
public class SmsSendResponse {

    private Boolean success;
    private String message;

    @JsonProperty("creditsUsed")
    private Integer creditsUsed;

    public SmsSendResponse() {
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getCreditsUsed() {
        return creditsUsed;
    }

    public void setCreditsUsed(Integer creditsUsed) {
        this.creditsUsed = creditsUsed;
    }
}
