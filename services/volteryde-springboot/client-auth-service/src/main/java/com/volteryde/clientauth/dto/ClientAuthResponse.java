package com.volteryde.clientauth.dto;

/**
 * Authentication response with tokens
 */
public class ClientAuthResponse {

    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private ClientUserDto user;

    public ClientAuthResponse() {}

    public ClientAuthResponse(String accessToken, String refreshToken, Long expiresIn, ClientUserDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public Long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(Long expiresIn) { this.expiresIn = expiresIn; }

    public ClientUserDto getUser() { return user; }
    public void setUser(ClientUserDto user) { this.user = user; }
}
