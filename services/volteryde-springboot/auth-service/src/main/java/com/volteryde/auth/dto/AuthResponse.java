package com.volteryde.auth.dto;

/**
 * Authentication response with tokens
 */
public class AuthResponse {

	private String accessToken;
	private String refreshToken;
	private Long expiresIn;
	private String tokenType = "Bearer";
	private UserDto user;

	// Constructors
	public AuthResponse() {
	}

	public AuthResponse(String accessToken, String refreshToken, Long expiresIn, UserDto user) {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresIn = expiresIn;
		this.user = user;
	}

	// Getters and Setters
	public String getAccessToken() {
		return accessToken;
	}

	public void setAccessToken(String accessToken) {
		this.accessToken = accessToken;
	}

	public String getRefreshToken() {
		return refreshToken;
	}

	public void setRefreshToken(String refreshToken) {
		this.refreshToken = refreshToken;
	}

	public Long getExpiresIn() {
		return expiresIn;
	}

	public void setExpiresIn(Long expiresIn) {
		this.expiresIn = expiresIn;
	}

	public String getTokenType() {
		return tokenType;
	}

	public void setTokenType(String tokenType) {
		this.tokenType = tokenType;
	}

	public UserDto getUser() {
		return user;
	}

	public void setUser(UserDto user) {
		this.user = user;
	}
}
