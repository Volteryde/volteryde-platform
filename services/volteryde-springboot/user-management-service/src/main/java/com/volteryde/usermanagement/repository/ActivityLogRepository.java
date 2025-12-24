package com.volteryde.usermanagement.repository;

import com.volteryde.usermanagement.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
	List<ActivityLog> findByActorId(UUID actorId);

	List<ActivityLog> findByTargetId(UUID targetId);

	List<ActivityLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
