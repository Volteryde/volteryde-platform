package com.volteryde.clientauth.dto;

/**
 * Returned when a user initiates 2FA setup.
 * The client renders a QR code from {@code otpAuthUri} for the user to scan
 * with their authenticator app (Google Authenticator, Authy, etc.).
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
