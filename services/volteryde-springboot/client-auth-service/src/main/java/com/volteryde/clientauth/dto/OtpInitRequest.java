package com.volteryde.clientauth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request to initiate OTP login/registration
 */
public class OtpInitRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{6,14}$", message = "Invalid phone number format")
    private String phone;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
