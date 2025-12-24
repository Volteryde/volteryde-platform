package com.volteryde.usermanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.UUID;

@Entity
@Table(name = "driver_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Column(name = "license_number", nullable = false, unique = true)
	private String licenseNumber;

	@Column(name = "years_of_experience")
	private int yearsOfExperience;

	@Column(name = "vehicle_assigned_id")
	private String vehicleAssignedId; // ID from Fleet Service

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	@Builder.Default
	private DriverStatus status = DriverStatus.INACTIVE;

	public enum DriverStatus {
		ACTIVE,
		INACTIVE,
		ON_TRIP,
		SUSPENDED
	}
}
