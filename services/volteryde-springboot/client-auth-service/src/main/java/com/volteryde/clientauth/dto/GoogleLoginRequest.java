package com.volteryde.clientauth.dto;

/**
 * Google OAuth login request
 * 
 * Austin: For new users, terms acceptance is required.
 * Existing users don't need to accept terms again during login.
 * 
 * Phone number is optional - it's included when user verified phone via OTP
 * before switching to Google OAuth for profile completion.
 */
public class GoogleLoginRequest {

    private String googleId;
    private String idToken;
    private String accessToken;
    private String email;
    private String firstName;
    private String lastName;
    private String profileImageUrl;
    private String phone; // Optional: verified phone number from OTP flow
    
    // Austin: Required for new user registration via Google
    private Boolean termsAccepted;
    private Boolean privacyAccepted;

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Boolean getTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(Boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public Boolean getPrivacyAccepted() { return privacyAccepted; }
    public void setPrivacyAccepted(Boolean privacyAccepted) { this.privacyAccepted = privacyAccepted; }

    public boolean isFullyAccepted() {
        return Boolean.TRUE.equals(termsAccepted) && Boolean.TRUE.equals(privacyAccepted);
    }
}
