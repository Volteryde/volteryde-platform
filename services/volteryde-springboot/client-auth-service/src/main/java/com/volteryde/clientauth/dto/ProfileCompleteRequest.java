package com.volteryde.clientauth.dto;

import com.volteryde.clientauth.entity.ClientRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request to complete client profile after OTP verification
 */
public class ProfileCompleteRequest {

    @NotBlank(message = "Signup token is required")
    private String signupToken;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;

    private ClientRole role = ClientRole.RIDER;

    // Austin: Terms acceptance is required to complete profile
    @NotNull(message = "Terms acceptance is required")
    private Boolean termsAccepted;

    @NotNull(message = "Privacy policy acceptance is required")
    private Boolean privacyAccepted;

    public String getSignupToken() { return signupToken; }
    public void setSignupToken(String signupToken) { this.signupToken = signupToken; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public ClientRole getRole() { return role; }
    public void setRole(ClientRole role) { this.role = role; }

    public Boolean getTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(Boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public Boolean getPrivacyAccepted() { return privacyAccepted; }
    public void setPrivacyAccepted(Boolean privacyAccepted) { this.privacyAccepted = privacyAccepted; }

    /**
     * Check if both terms and privacy are accepted
     */
    public boolean isFullyAccepted() {
        return Boolean.TRUE.equals(termsAccepted) && Boolean.TRUE.equals(privacyAccepted);
    }
}
