package com.volteryde.clientauth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to refresh access token
 */
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}
