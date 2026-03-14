package com.volteryde.usermanagement.service;

import com.volteryde.usermanagement.model.DriverProfile;

public interface DriverService {

	/**
	 * Get the DriverProfile for the authenticated driver, looked up by their auth-service ID.
	 */
	DriverProfile getDriverProfile(String authId);

	/**
	 * Set the driver's availability. Only ACTIVE and INACTIVE transitions are
	 * allowed via self-service; ON_TRIP and SUSPENDED are system/admin-managed.
	 */
	void updateAvailability(String authId, boolean available);
}
