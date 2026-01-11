package com.volteryde.clientauth.dto;

import jakarta.validation.constraints.Email;

/**
 * Request to update user profile
 */
public class UpdateProfileRequest {

    private String firstName;
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private String profileImageUrl;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
}
