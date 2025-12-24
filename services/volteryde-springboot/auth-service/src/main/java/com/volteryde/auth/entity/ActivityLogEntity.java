package com.volteryde.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for tracking all system activities for auditing and compliance.
 * Every login, logout, password change, and significant action is logged.
 */
@Entity
@Table(name = "activity_logs", indexes = {
		@Index(name = "idx_activity_user_id", columnList = "userId"),
		@Index(name = "idx_activity_action", columnList = "action"),
		@Index(name = "idx_activity_created_at", columnList = "createdAt"),
		@Index(name = "idx_activity_action_type", columnList = "actionType")
})
public class ActivityLogEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/**
	 * User ID who performed the action (null for anonymous actions like failed
	 * logins)
	 */
	@Column(length = 255)
	private String userId;

	/**
	 * User email (for easier identification in logs)
	 */
	@Column(length = 255)
	private String userEmail;

	/**
	 * Specific action performed (e.g., LOGIN_SUCCESS, LOGOUT, PASSWORD_CHANGED)
	 */
	@Column(nullable = false, length = 100)
	private String action;

	/**
	 * Category of action (AUTH, USER, ADMIN, PAYMENT, SYSTEM)
	 */
	@Column(nullable = false, length = 50)
	private String actionType;

	/**
	 * Type of entity affected (e.g., USER, ROLE, PAYMENT)
	 */
	@Column(length = 100)
	private String targetType;

	/**
	 * ID of the entity affected
	 */
	@Column(length = 255)
	private String targetId;

	/**
	 * IP address of the request
	 */
	@Column(length = 45)
	private String ipAddress;

	/**
	 * Browser/client user agent
	 */
	@Column(columnDefinition = "TEXT")
	private String userAgent;

	/**
	 * Additional metadata as JSON (request details, old/new values, etc.)
	 */
	@Column(columnDefinition = "TEXT")
	private String metadata;

	/**
	 * Status of the action (SUCCESS, FAILED, PENDING)
	 */
	@Column(nullable = false, length = 20)
	private String status = "SUCCESS";

	/**
	 * Error message if action failed
	 */
	@Column(columnDefinition = "TEXT")
	private String errorMessage;

	/**
	 * Timestamp when the action occurred
	 */
	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}

	// Getters and Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getUserEmail() {
		return userEmail;
	}

	public void setUserEmail(String userEmail) {
		this.userEmail = userEmail;
	}

	public String getAction() {
		return action;
	}

	public void setAction(String action) {
		this.action = action;
	}

	public String getActionType() {
		return actionType;
	}

	public void setActionType(String actionType) {
		this.actionType = actionType;
	}

	public String getTargetType() {
		return targetType;
	}

	public void setTargetType(String targetType) {
		this.targetType = targetType;
	}

	public String getTargetId() {
		return targetId;
	}

	public void setTargetId(String targetId) {
		this.targetId = targetId;
	}

	public String getIpAddress() {
		return ipAddress;
	}

	public void setIpAddress(String ipAddress) {
		this.ipAddress = ipAddress;
	}

	public String getUserAgent() {
		return userAgent;
	}

	public void setUserAgent(String userAgent) {
		this.userAgent = userAgent;
	}

	public String getMetadata() {
		return metadata;
	}

	public void setMetadata(String metadata) {
		this.metadata = metadata;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getErrorMessage() {
		return errorMessage;
	}

	public void setErrorMessage(String errorMessage) {
		this.errorMessage = errorMessage;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
