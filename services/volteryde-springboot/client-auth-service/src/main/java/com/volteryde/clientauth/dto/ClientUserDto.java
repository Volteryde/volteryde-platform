package com.volteryde.clientauth.dto;

import com.volteryde.clientauth.entity.ClientRole;
import com.volteryde.clientauth.entity.ClientStatus;
import com.volteryde.clientauth.entity.ClientUser;

/**
 * Client user DTO for API responses
 */
public class ClientUserDto {

    private String id;
    private String phone;
    private String email;
    private String firstName;
    private String lastName;
    private ClientRole role;
    private ClientStatus status;
    private String profileImageUrl;
    private boolean phoneVerified;
    private boolean emailVerified;
    private boolean termsAccepted;

    public ClientUserDto() {}

    public static ClientUserDto fromEntity(ClientUser user) {
        ClientUserDto dto = new ClientUserDto();
        dto.setId(user.getId());
        dto.setPhone(user.getPhone());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        dto.setPhoneVerified(user.isPhoneVerified());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setTermsAccepted(user.isTermsAccepted());
        return dto;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public ClientRole getRole() { return role; }
    public void setRole(ClientRole role) { this.role = role; }

    public ClientStatus getStatus() { return status; }
    public void setStatus(ClientStatus status) { this.status = status; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public boolean isTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(boolean termsAccepted) { this.termsAccepted = termsAccepted; }
}
