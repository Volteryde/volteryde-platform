package com.volteryde.usermanagement.service;

import java.util.UUID;

public interface ActivityLogService {
	void logActivity(UUID actorId, String action, String resourceType, UUID targetId, String details, String ipAddress);
}
