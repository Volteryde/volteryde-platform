package com.volteryde.clientauth.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request to accept terms and conditions
 * 
 * Austin: Used during new user onboarding to record terms acceptance.
 * Both terms and privacy policy must be explicitly accepted.
 */
public class TermsAcceptanceRequest {

    @NotNull(message = "Terms acceptance is required")
    private Boolean termsAccepted;

    @NotNull(message = "Privacy policy acceptance is required")
    private Boolean privacyAccepted;

    private String termsVersion;
    private String privacyVersion;

    public TermsAcceptanceRequest() {}

    public TermsAcceptanceRequest(Boolean termsAccepted, Boolean privacyAccepted) {
        this.termsAccepted = termsAccepted;
        this.privacyAccepted = privacyAccepted;
    }

    public Boolean getTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(Boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public Boolean getPrivacyAccepted() { return privacyAccepted; }
    public void setPrivacyAccepted(Boolean privacyAccepted) { this.privacyAccepted = privacyAccepted; }

    public String getTermsVersion() { return termsVersion; }
    public void setTermsVersion(String termsVersion) { this.termsVersion = termsVersion; }

    public String getPrivacyVersion() { return privacyVersion; }
    public void setPrivacyVersion(String privacyVersion) { this.privacyVersion = privacyVersion; }

    /**
     * Validate that both are accepted
     */
    public boolean isFullyAccepted() {
        return Boolean.TRUE.equals(termsAccepted) && Boolean.TRUE.equals(privacyAccepted);
    }
}
