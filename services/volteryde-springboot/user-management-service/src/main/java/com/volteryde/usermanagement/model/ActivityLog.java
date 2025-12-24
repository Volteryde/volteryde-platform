package com.volteryde.usermanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "actor_id", nullable = false)
	private UUID actorId; // Who performed the action

	@Column(name = "target_id")
	private UUID targetId; // Who/What was affected

	@Column(nullable = false)
	private String action; // e.g., "CREATE_USER", "RESET_PASSWORD"

	@Column(name = "resource_type")
	private String resourceType; // e.g., "USER", "DRIVER_PROFILE"

	@Column(columnDefinition = "TEXT")
	private String details; // JSON or text description

	@Column(name = "ip_address")
	private String ipAddress;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;
}
