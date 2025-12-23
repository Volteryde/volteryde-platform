package com.volteryde.auth.entity;

import com.volteryde.auth.entity.RoleEntity.UserRole;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for managing invite codes for user registration
 */
@Entity
@Table(name = "invite_codes")
public class InviteCodeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private String id;

	@Column(unique = true, nullable = false, length = 32)
	private String code;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private UserRole assignedRole;

	@Column
	private String organizationId;

	@Column
	private Integer maxUses;

	@Column(nullable = false)
	private Integer currentUses = 0;

	@Column
	private LocalDateTime expiresAt;

	@Column(nullable = false)
	private Boolean active = true;

	@Column
	private String createdBy;

	@Column(nullable = false)
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
	}

	/**
	 * Check if this invite code is valid for use
	 */
	public boolean isValid() {
		if (!active) {
			return false;
		}
		if (expiresAt != null && expiresAt.isBefore(LocalDateTime.now())) {
			return false;
		}
		if (maxUses != null && currentUses >= maxUses) {
			return false;
		}
		return true;
	}

	/**
	 * Increment usage count
	 */
	public void incrementUsage() {
		this.currentUses++;
	}

	// Getters and Setters
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public UserRole getAssignedRole() {
		return assignedRole;
	}

	public void setAssignedRole(UserRole assignedRole) {
		this.assignedRole = assignedRole;
	}

	public String getOrganizationId() {
		return organizationId;
	}

	public void setOrganizationId(String organizationId) {
		this.organizationId = organizationId;
	}

	public Integer getMaxUses() {
		return maxUses;
	}

	public void setMaxUses(Integer maxUses) {
		this.maxUses = maxUses;
	}

	public Integer getCurrentUses() {
		return currentUses;
	}

	public void setCurrentUses(Integer currentUses) {
		this.currentUses = currentUses;
	}

	public LocalDateTime getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(LocalDateTime expiresAt) {
		this.expiresAt = expiresAt;
	}

	public Boolean getActive() {
		return active;
	}

	public void setActive(Boolean active) {
		this.active = active;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
