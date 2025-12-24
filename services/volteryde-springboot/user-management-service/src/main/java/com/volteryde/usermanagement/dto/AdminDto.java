package com.volteryde.usermanagement.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.UUID;

public class AdminDto {

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OnboardDriverRequest {
		private String email;
		private String firstName;
		private String lastName;
		private String phoneNumber;
		private String licenseNumber;
		private int yearsOfExperience;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OnboardManagerRequest {
		private String email;
		private String firstName;
		private String lastName;
		private String phoneNumber;
		private String assignedRegion;
		private String hubId;
	}

	@Data
	@Builder
	public static class DriverResponse {
		private UUID userId;
		private UUID profileId;
		private String fullName;
		private String licenseNumber;
		private String status;
		private String vehicleAssignedId;
	}
}
