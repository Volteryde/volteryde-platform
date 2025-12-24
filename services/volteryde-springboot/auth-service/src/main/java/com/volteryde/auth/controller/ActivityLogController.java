package com.volteryde.auth.controller;

import com.volteryde.auth.entity.ActivityLogEntity;
import com.volteryde.auth.entity.UserEntity;
import com.volteryde.auth.repository.UserRepository;
import com.volteryde.auth.service.ActivityLogService;
import com.volteryde.shared.dto.ActivityLogRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Controller for managing activity logs.
 * Allows viewing logs (Admin) and creating logs (Internal Services).
 */
@RestController
@RequestMapping("/activity-logs")
public class ActivityLogController {

	private final ActivityLogService activityLogService;
	private final UserRepository userRepository;

	public ActivityLogController(ActivityLogService activityLogService, UserRepository userRepository) {
		this.activityLogService = activityLogService;
		this.userRepository = userRepository;
	}

	/**
	 * Get all activity logs (Admin only)
	 */
	@GetMapping
	public ResponseEntity<Page<ActivityLogEntity>> getAllLogs(
			@RequestParam(required = false) String userId,
			@RequestParam(required = false) String action,
			@RequestParam(required = false) String actionType,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
			@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

		Page<ActivityLogEntity> logs;
		if (userId != null || action != null || actionType != null || status != null || startDate != null
				|| endDate != null) {
			logs = activityLogService.getLogsWithFilters(userId, action, actionType, status, startDate, endDate, pageable);
		} else {
			logs = activityLogService.getAllLogs(pageable);
		}

		return ResponseEntity.ok(logs);
	}

	/**
	 * Create an activity log (Internal use by other services)
	 */
	@PostMapping
	public ResponseEntity<Void> createLog(
			@RequestBody ActivityLogRequest request,
			HttpServletRequest httpRequest) {

		String ipAddress = httpRequest.getRemoteAddr();
		String userAgent = httpRequest.getHeader("User-Agent");

		UserEntity user = null;
		String userId = request.getUserId();
		if (userId != null) {
			user = userRepository.findById(userId).orElse(null);
		} else if (request.getUserEmail() != null) {
			user = userRepository.findByEmail(request.getUserEmail()).orElse(null);
		}

		if (user != null) {
			activityLogService.logActivity(
					user,
					request.getAction(),
					request.getActionType(),
					ipAddress,
					userAgent,
					request.getMetadata(),
					request.getStatus(),
					request.getErrorMessage());
		} else if (request.getUserEmail() != null) {
			activityLogService.logActivityByEmail(
					request.getUserEmail(),
					request.getAction(),
					request.getActionType(),
					ipAddress,
					userAgent,
					request.getMetadata(),
					request.getStatus(),
					request.getErrorMessage());
		}

		return ResponseEntity.ok().build();
	}

	/**
	 * Get logs for a specific user
	 */
	@GetMapping("/user/{userId}")
	public ResponseEntity<Page<ActivityLogEntity>> getUserLogs(
			@PathVariable String userId,
			@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
		return ResponseEntity.ok(activityLogService.getLogsByUserId(userId, pageable));
	}
}
