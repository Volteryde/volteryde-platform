package com.volteryde.usermanagement.service.impl;

import com.volteryde.usermanagement.model.ActivityLog;
import com.volteryde.usermanagement.repository.ActivityLogRepository;
import com.volteryde.usermanagement.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogServiceImpl implements ActivityLogService {

	private final ActivityLogRepository activityLogRepository;

	@Override
	@Async // Run in background to not block main thread
	@Transactional
	@SuppressWarnings("null")
	public void logActivity(UUID actorId, String action, String resourceType, UUID targetId, String details,
			String ipAddress) {
		log.info("Auditing Action: {} by Actor: {} on Target: {}", action, actorId, targetId);

		ActivityLog logEntry = ActivityLog.builder()
				.actorId(actorId)
				.action(action)
				.resourceType(resourceType)
				.targetId(targetId)
				.details(details)
				.ipAddress(ipAddress)
				.build();

		activityLogRepository.save(logEntry);
	}
}
