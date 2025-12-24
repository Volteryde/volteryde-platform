package com.volteryde.auth.repository;

import com.volteryde.auth.entity.ActivityLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for querying activity logs with various filters.
 */
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLogEntity, Long> {

	/**
	 * Find all activity logs for a specific user
	 */
	Page<ActivityLogEntity> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

	/**
	 * Find all activity logs by action type
	 */
	Page<ActivityLogEntity> findByActionTypeOrderByCreatedAtDesc(String actionType, Pageable pageable);

	/**
	 * Find all activity logs by specific action
	 */
	Page<ActivityLogEntity> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

	/**
	 * Find activity logs within a date range
	 */
	Page<ActivityLogEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(
			LocalDateTime startDate,
			LocalDateTime endDate,
			Pageable pageable);

	/**
	 * Find activity logs by user and date range
	 */
	@Query("SELECT a FROM ActivityLogEntity a WHERE a.userId = :userId AND a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
	Page<ActivityLogEntity> findByUserIdAndDateRange(
			@Param("userId") String userId,
			@Param("startDate") LocalDateTime startDate,
			@Param("endDate") LocalDateTime endDate,
			Pageable pageable);

	/**
	 * Find activity logs with multiple filters
	 */
	@Query("SELECT a FROM ActivityLogEntity a WHERE " +
			"(:userId IS NULL OR a.userId = :userId) AND " +
			"(:action IS NULL OR a.action = :action) AND " +
			"(:actionType IS NULL OR a.actionType = :actionType) AND " +
			"(:status IS NULL OR a.status = :status) AND " +
			"(:startDate IS NULL OR a.createdAt >= :startDate) AND " +
			"(:endDate IS NULL OR a.createdAt <= :endDate) " +
			"ORDER BY a.createdAt DESC")
	Page<ActivityLogEntity> findWithFilters(
			@Param("userId") String userId,
			@Param("action") String action,
			@Param("actionType") String actionType,
			@Param("status") String status,
			@Param("startDate") LocalDateTime startDate,
			@Param("endDate") LocalDateTime endDate,
			Pageable pageable);

	/**
	 * Count activities by action type for statistics
	 */
	@Query("SELECT a.action, COUNT(a) FROM ActivityLogEntity a WHERE a.createdAt >= :since GROUP BY a.action")
	List<Object[]> countByActionSince(@Param("since") LocalDateTime since);

	/**
	 * Find recent failed login attempts for a user (security)
	 */
	@Query("SELECT a FROM ActivityLogEntity a WHERE a.userEmail = :email AND a.action = 'LOGIN_FAILED' AND a.createdAt >= :since ORDER BY a.createdAt DESC")
	List<ActivityLogEntity> findRecentFailedLogins(
			@Param("email") String email,
			@Param("since") LocalDateTime since);

	/**
	 * Find all activities ordered by most recent
	 */
	Page<ActivityLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
