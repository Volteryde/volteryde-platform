package com.volteryde.clientauth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * OTP Entity
 * 
 * Stores OTP records for phone/email verification.
 * Now uses Gatekeeper Pro API for OTP generation - the reference field
 * stores the external reference UUID for verification.
 */
@Entity
@Table(name = "client_otps")
public class Otp {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = true, length = 20)
    private String phone;

    @Column(nullable = true, length = 255)
    private String email;

    /**
     * The OTP code - now only stored for local fallback.
     * External verification uses the reference field.
     */
    @Column(nullable = true, length = 10)
    private String code;

    /**
     * External OTP reference UUID from Gatekeeper Pro API.
     * Used to verify OTP via external API call.
     */
    @Column(name = "external_reference", length = 100)
    private String externalReference;

    /**
     * Receiver name returned from Gatekeeper Pro (auto name resolution).
     */
    @Column(name = "receiver_name", length = 100)
    private String receiverName;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(name = "attempts")
    private int attempts = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Whether this OTP was generated via external API (Gatekeeper Pro).
     */
    @Column(name = "external_provider")
    private boolean externalProvider = false;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getExternalReference() { return externalReference; }
    public void setExternalReference(String externalReference) { this.externalReference = externalReference; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isExternalProvider() { return externalProvider; }
    public void setExternalProvider(boolean externalProvider) { this.externalProvider = externalProvider; }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !used && !isExpired() && attempts < 3;
    }

    public void incrementAttempts() {
        this.attempts++;
    }

    /**
     * Check if this OTP should use external verification.
     */
    public boolean shouldUseExternalVerification() {
        return externalProvider && externalReference != null && !externalReference.isEmpty();
    }
}
