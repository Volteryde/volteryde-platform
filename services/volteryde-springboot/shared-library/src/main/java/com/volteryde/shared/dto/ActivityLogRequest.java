package com.volteryde.shared.dto;

import com.volteryde.shared.enums.ActivityAction;
import com.volteryde.shared.enums.ActivityType;
import java.util.Map;

/**
 * Request payload for logging an activity from another service.
 */
public class ActivityLogRequest {

	private String userId;
	private String userEmail;
	private ActivityAction action;
	private ActivityType actionType;
	private String targetType;
	private String targetId;
	private String status;
	private String errorMessage;
	private Map<String, Object> metadata;

	public ActivityLogRequest() {
	}

	public ActivityLogRequest(String userId, String userEmail, ActivityAction action, ActivityType actionType,
			String targetType, String targetId, String status, String errorMessage, Map<String, Object> metadata) {
		this.userId = userId;
		this.userEmail = userEmail;
		this.action = action;
		this.actionType = actionType;
		this.targetType = targetType;
		this.targetId = targetId;
		this.status = status;
		this.errorMessage = errorMessage;
		this.metadata = metadata;
	}

	// Getters and Setters
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

	public ActivityAction getAction() {
		return action;
	}

	public void setAction(ActivityAction action) {
		this.action = action;
	}

	public ActivityType getActionType() {
		return actionType;
	}

	public void setActionType(ActivityType actionType) {
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

	public Map<String, Object> getMetadata() {
		return metadata;
	}

	public void setMetadata(Map<String, Object> metadata) {
		this.metadata = metadata;
	}
}
