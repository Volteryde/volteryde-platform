package com.volteryde.usermanagement.controller;

import com.volteryde.usermanagement.model.DriverProfile;
import com.volteryde.usermanagement.service.DriverService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Self-service endpoints for authenticated drivers.
 * All endpoints require the DRIVER role; the authId comes from the JWT principal.
 */
@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

	private final DriverService driverService;

	/**
	 * GET /api/drivers/profile
	 * Returns the calling driver's profile (license, status, assigned vehicle).
	 */
	@GetMapping("/profile")
	@PreAuthorize("hasAuthority('DRIVER')")
	public ResponseEntity<DriverProfileResponse> getMyProfile(Authentication authentication) {
		String authId = authentication.getName();
		DriverProfile profile = driverService.getDriverProfile(authId);
		return ResponseEntity.ok(DriverProfileResponse.from(profile));
	}

	/**
	 * PATCH /api/drivers/profile/availability
	 * Lets the driver toggle their own availability (ACTIVE / INACTIVE).
	 * ON_TRIP and SUSPENDED are system-managed and cannot be changed here.
	 */
	@PatchMapping("/profile/availability")
	@PreAuthorize("hasAuthority('DRIVER')")
	public ResponseEntity<Void> updateAvailability(
			@RequestBody AvailabilityRequest request,
			Authentication authentication) {
		String authId = authentication.getName();
		driverService.updateAvailability(authId, request.isAvailable());
		return ResponseEntity.noContent().build();
	}

	// ---- Nested DTOs ----

	@Data
	public static class AvailabilityRequest {
		private boolean available;
	}

	@Data
	public static class DriverProfileResponse {
		private UUID profileId;
		private String userId;
		private String licenseNumber;
		private int yearsOfExperience;
		private String vehicleAssignedId;
		private String status;

		public static DriverProfileResponse from(DriverProfile p) {
			DriverProfileResponse r = new DriverProfileResponse();
			r.profileId = p.getId();
			r.userId = p.getUser().getUserId();
			r.licenseNumber = p.getLicenseNumber();
			r.yearsOfExperience = p.getYearsOfExperience();
			r.vehicleAssignedId = p.getVehicleAssignedId();
			r.status = p.getStatus().name();
			return r;
		}
	}
}
