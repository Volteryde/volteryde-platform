package com.volteryde.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Token refresh request DTO
 */
public class RefreshTokenRequest {

	@NotBlank(message = "Refresh token is required")
	private String refreshToken;

	public String getRefreshToken() {
		return refreshToken;
	}

	public void setRefreshToken(String refreshToken) {
		this.refreshToken = refreshToken;
	}
}
