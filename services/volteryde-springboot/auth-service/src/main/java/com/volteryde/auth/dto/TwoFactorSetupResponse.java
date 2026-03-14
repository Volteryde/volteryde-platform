package com.volteryde.auth.dto;

/**
 * Returned when a user initiates or is forced into 2FA setup.
 */
public class TwoFactorSetupResponse {

    private String secret;
    private String otpAuthUri;

    public TwoFactorSetupResponse(String secret, String otpAuthUri) {
        this.secret = secret;
        this.otpAuthUri = otpAuthUri;
    }

    public String getSecret() { return secret; }
    public String getOtpAuthUri() { return otpAuthUri; }
}
