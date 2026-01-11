package com.volteryde.clientauth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Terms Acceptance Entity
 * 
 * Austin: Tracks client acceptance of terms and conditions and privacy policy.
 * This is required for regulatory compliance and audit purposes.
 * Authentication cannot complete without terms acceptance.
 */
@Entity
@Table(name = "client_terms_acceptances")
public class TermsAcceptance {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private ClientUser user;

    @Column(name = "terms_version", nullable = false, length = 20)
    private String termsVersion;

    @Column(name = "privacy_version", nullable = false, length = 20)
    private String privacyVersion;

    @Column(name = "terms_accepted")
    private boolean termsAccepted = false;

    @Column(name = "privacy_accepted")
    private boolean privacyAccepted = false;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        if (termsAccepted && privacyAccepted && acceptedAt == null) {
            acceptedAt = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ClientUser getUser() { return user; }
    public void setUser(ClientUser user) { this.user = user; }

    public String getTermsVersion() { return termsVersion; }
    public void setTermsVersion(String termsVersion) { this.termsVersion = termsVersion; }

    public String getPrivacyVersion() { return privacyVersion; }
    public void setPrivacyVersion(String privacyVersion) { this.privacyVersion = privacyVersion; }

    public boolean isTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public boolean isPrivacyAccepted() { return privacyAccepted; }
    public void setPrivacyAccepted(boolean privacyAccepted) { this.privacyAccepted = privacyAccepted; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    /**
     * Check if both terms and privacy policy are accepted
     */
    public boolean isFullyAccepted() {
        return termsAccepted && privacyAccepted;
    }
}
