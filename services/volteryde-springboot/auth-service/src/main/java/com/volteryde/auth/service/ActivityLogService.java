package com.volteryde.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.volteryde.auth.entity.ActivityLogEntity;
import com.volteryde.auth.entity.UserEntity;
import com.volteryde.auth.repository.ActivityLogRepository;
import com.volteryde.shared.enums.ActivityAction;
import com.volteryde.shared.enums.ActivityType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Service for logging all system activities for auditing and compliance.
 * Uses async processing to avoid impacting request performance.
 */
@Service
public class ActivityLogService {

	private static final Logger logger = LoggerFactory.getLogger(ActivityLogService.class);
	private final ActivityLogRepository activityLogRepository;
	private final ObjectMapper objectMapper;

	public ActivityLogService(ActivityLogRepository activityLogRepository, ObjectMapper objectMapper) {
		this.activityLogRepository = activityLogRepository;
		this.objectMapper = objectMapper;
	}

	/**
	 * Log an activity asynchronously
	 */
	@Async
	@Transactional
	public void logActivity(
			UserEntity user,
			ActivityAction action,
			ActivityType actionType,
			String ipAddress,
			String userAgent,
			Map<String, Object> metadata,
			String status,
			String errorMessage) {
		try {
			ActivityLogEntity log = new ActivityLogEntity();

			if (user != null) {
				log.setUserId(user.getId().toString());
				log.setUserEmail(user.getEmail());
			}

			log.setAction(action.name());
			log.setActionType(actionType.name());
			log.setIpAddress(ipAddress);
			log.setUserAgent(userAgent);
			log.setStatus(status != null ? status : "SUCCESS");
			log.setErrorMessage(errorMessage);

			if (metadata != null && !metadata.isEmpty()) {
				try {
					log.setMetadata(objectMapper.writeValueAsString(metadata));
				} catch (JsonProcessingException e) {
					logger.warn("Failed to serialize activity metadata", e);
				}
			}

			activityLogRepository.save(log);
			logger.debug("Activity logged: {} by user {}", action, user != null ? user.getEmail() : "anonymous");

		} catch (Exception e) {
			logger.error("Failed to log activity: {}", action, e);
		}
	}

	/**
	 * Log activity with user email only (for failed attempts where user doesn't
	 * exist)
	 */
	@Async
	@Transactional
	public void logActivityByEmail(
			String email,
			ActivityAction action,
			ActivityType actionType,
			String ipAddress,
			String userAgent,
			Map<String, Object> metadata,
			String status,
			String errorMessage) {
		try {
			ActivityLogEntity log = new ActivityLogEntity();
			log.setUserEmail(email);
			log.setAction(action.name());
			log.setActionType(actionType.name());
			log.setIpAddress(ipAddress);
			log.setUserAgent(userAgent);
			log.setStatus(status != null ? status : "SUCCESS");
			log.setErrorMessage(errorMessage);

			if (metadata != null && !metadata.isEmpty()) {
				try {
					log.setMetadata(objectMapper.writeValueAsString(metadata));
				} catch (JsonProcessingException e) {
					logger.warn("Failed to serialize activity metadata", e);
				}
			}

			activityLogRepository.save(log);
			logger.debug("Activity logged: {} for email {}", action, email);

		} catch (Exception e) {
			logger.error("Failed to log activity: {}", action, e);
		}
	}

	/**
	 * Log a successful login
	 */
	public void logLoginSuccess(UserEntity user, String ipAddress, String userAgent) {
		logActivity(user, ActivityAction.LOGIN_SUCCESS, ActivityType.AUTH, ipAddress, userAgent, null, "SUCCESS", null);
	}

	/**
	 * Log a failed login attempt
	 */
	public void logLoginFailed(String identifier, String ipAddress, String userAgent, String reason) {
		logActivityByEmail(identifier, ActivityAction.LOGIN_FAILED, ActivityType.AUTH, ipAddress, userAgent,
				Map.of("reason", reason), "FAILED", reason);
	}

	/**
	 * Log a logout
	 */
	public void logLogout(UserEntity user, String ipAddress, String userAgent) {
		logActivity(user, ActivityAction.LOGOUT, ActivityType.AUTH, ipAddress, userAgent, null, "SUCCESS", null);
	}

	/**
	 * Log password reset request
	 */
	public void logPasswordResetRequest(String email, String ipAddress, String userAgent) {
		logActivityByEmail(email, ActivityAction.PASSWORD_RESET_REQUEST, ActivityType.AUTH, ipAddress, userAgent, null,
				"SUCCESS", null);
	}

	/**
	 * Log password reset completion
	 */
	public void logPasswordResetComplete(UserEntity user, String ipAddress, String userAgent) {
		logActivity(user, ActivityAction.PASSWORD_RESET_COMPLETE, ActivityType.AUTH, ipAddress, userAgent, null,
				"SUCCESS", null);
	}

	/**
	 * Log new user registration
	 */
	public void logRegistration(UserEntity user, String ipAddress, String userAgent) {
		logActivity(user, ActivityAction.REGISTER, ActivityType.AUTH, ipAddress, userAgent, null, "SUCCESS", null);
	}

	/**
	 * Log email verification
	 */
	public void logEmailVerified(UserEntity user, String ipAddress, String userAgent) {
		logActivity(user, ActivityAction.EMAIL_VERIFIED, ActivityType.AUTH, ipAddress, userAgent, null, "SUCCESS", null);
	}

	/**
	 * Log admin action on user
	 */
	public void logAdminAction(UserEntity admin, UserEntity targetUser, ActivityAction action, String ipAddress,
			String userAgent, Map<String, Object> changes) {
		ActivityLogEntity log = new ActivityLogEntity();
		log.setUserId(admin.getId().toString());
		log.setUserEmail(admin.getEmail());
		log.setAction(action.name());
		log.setActionType(ActivityType.ADMIN.name());
		log.setTargetType("USER");
		log.setTargetId(targetUser.getId().toString());
		log.setIpAddress(ipAddress);
		log.setUserAgent(userAgent);
		log.setStatus("SUCCESS");

		if (changes != null && !changes.isEmpty()) {
			try {
				log.setMetadata(objectMapper.writeValueAsString(changes));
			} catch (JsonProcessingException e) {
				logger.warn("Failed to serialize admin action metadata", e);
			}
		}

		activityLogRepository.save(log);
	}

	// ================== Query Methods ==================

	/**
	 * Get all activity logs with pagination
	 */
	public Page<ActivityLogEntity> getAllLogs(Pageable pageable) {
		return activityLogRepository.findAllByOrderByCreatedAtDesc(pageable);
	}

	/**
	 * Get activity logs for a specific user
	 */
	public Page<ActivityLogEntity> getLogsByUserId(String userId, Pageable pageable) {
		return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
	}

	/**
	 * Get activity logs with filters
	 */
	public Page<ActivityLogEntity> getLogsWithFilters(
			String userId,
			String action,
			String actionType,
			String status,
			LocalDateTime startDate,
			LocalDateTime endDate,
			Pageable pageable) {
		return activityLogRepository.findWithFilters(userId, action, actionType, status, startDate, endDate, pageable);
	}

	/**
	 * Get single activity log by ID
	 */
	public ActivityLogEntity getLogById(Long id) {
		return activityLogRepository.findById(id).orElse(null);
	}

	/**
	 * Count recent failed logins for security monitoring
	 */
	public long countRecentFailedLogins(String email, int minutes) {
		LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
		return activityLogRepository.findRecentFailedLogins(email, since).size();
	}
}
