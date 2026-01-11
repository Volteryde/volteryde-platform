package com.volteryde.clientauth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request to verify OTP
 */
public class OtpVerifyRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "OTP code is required")
    @Size(min = 4, max = 8, message = "OTP must be between 4 and 8 digits")
    private String code;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
