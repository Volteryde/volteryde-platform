package com.volteryde.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing phone verification codes (OTPs)
 */
@Entity
@Table(name = "phone_verifications", indexes = {
		@Index(name = "idx_phone_verification_phone", columnList = "phone"),
		@Index(name = "idx_phone_verification_code", columnList = "code")
})
public class PhoneVerificationEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String phone;

	@Column(nullable = false, length = 6)
	private String code;

	@Column(nullable = false)
	private LocalDateTime expiresAt;

	@Column(nullable = false)
	private Boolean verified = false;

	@Column(nullable = false)
	private LocalDateTime createdAt;

	@Column
	private LocalDateTime verifiedAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
	}

	// Getters and Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public LocalDateTime getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(LocalDateTime expiresAt) {
		this.expiresAt = expiresAt;
	}

	public Boolean getVerified() {
		return verified;
	}

	public void setVerified(Boolean verified) {
		this.verified = verified;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getVerifiedAt() {
		return verifiedAt;
	}

	public void setVerifiedAt(LocalDateTime verifiedAt) {
		this.verifiedAt = verifiedAt;
	}
}
