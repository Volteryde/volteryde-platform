package com.volteryde.clientauth.dto;

import jakarta.validation.constraints.Email;

/**
 * Request to initiate password reset
 */
public class ForgotPasswordRequest {

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean hasEmail() {
        return email != null && !email.isBlank();
    }

    public boolean hasPhone() {
        return phone != null && !phone.isBlank();
    }
}
