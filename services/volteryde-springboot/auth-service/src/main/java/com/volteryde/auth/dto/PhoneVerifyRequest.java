package com.volteryde.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class PhoneVerifyRequest {
	@NotBlank(message = "Phone number is required")
	private String phone;

	@NotBlank(message = "OTP code is required")
	private String code;

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}
}
