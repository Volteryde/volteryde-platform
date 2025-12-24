package com.volteryde.usermanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.UUID;

@Entity
@Table(name = "fleet_manager_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetManagerProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Column(name = "assigned_region", nullable = false)
	private String assignedRegion; // e.g., "Accra-Central"

	@Column(name = "hub_id")
	private String hubId; // ID of the specific fleet hub/station
}
