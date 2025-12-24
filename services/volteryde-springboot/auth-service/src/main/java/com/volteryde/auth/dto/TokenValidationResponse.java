package com.volteryde.auth.dto;

import java.util.List;

/**
 * Token validation response DTO
 */
public class TokenValidationResponse {

	private Boolean valid;
	private String userId;
	private String email;
	private List<String> roles;

	public Boolean getValid() {
		return valid;
	}

	public void setValid(Boolean valid) {
		this.valid = valid;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public List<String> getRoles() {
		return roles;
	}

	public void setRoles(List<String> roles) {
		this.roles = roles;
	}
}
