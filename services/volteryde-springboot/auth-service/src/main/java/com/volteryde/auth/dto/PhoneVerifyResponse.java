package com.volteryde.auth.dto;

public class PhoneVerifyResponse {
	private boolean verified;
	private String signupToken; // Token to use for next step
	private String message;

	public PhoneVerifyResponse(boolean verified, String signupToken, String message) {
		this.verified = verified;
		this.signupToken = signupToken;
		this.message = message;
	}

	public boolean isVerified() {
		return verified;
	}

	public void setVerified(boolean verified) {
		this.verified = verified;
	}

	public String getSignupToken() {
		return signupToken;
	}

	public void setSignupToken(String signupToken) {
		this.signupToken = signupToken;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
}
