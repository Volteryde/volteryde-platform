package com.volteryde.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Login request DTO
 * Supports login via Access ID (VLT-XXXXXX) or Email + Password
 */
public class LoginRequest {

	@NotBlank(message = "Access ID or Email is required")
	private String identifier; // Can be email or access_id (VLT-XXXXXX)

	@NotBlank(message = "Passcode is required")
	private String password;

	private Boolean rememberMe = false;

	// Getters and Setters
	public String getIdentifier() {
		return identifier;
	}

	public void setIdentifier(String identifier) {
		this.identifier = identifier;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public Boolean getRememberMe() {
		return rememberMe;
	}

	public void setRememberMe(Boolean rememberMe) {
		this.rememberMe = rememberMe;
	}

	/**
	 * Check if the identifier looks like an access ID
	 * Supports: VR-A (Admin), VR-P (Partner), VR-CC (Customer Care),
	 * VR-SC (System Support), VR-DP (Dispatcher), VR-D (Driver),
	 * VR-FM (Fleet Manager), VLT- (legacy format)
	 */
	public boolean isAccessId() {
		if (identifier == null)
			return false;
		String upper = identifier.toUpperCase();
		return upper.startsWith("VR-") || upper.startsWith("VLT-");
	}

	/**
	 * @deprecated Use getIdentifier() instead
	 */
	@Deprecated
	public String getEmail() {
		return identifier;
	}

	/**
	 * @deprecated Use setIdentifier() instead
	 */
	@Deprecated
	public void setEmail(String email) {
		this.identifier = email;
	}
}
