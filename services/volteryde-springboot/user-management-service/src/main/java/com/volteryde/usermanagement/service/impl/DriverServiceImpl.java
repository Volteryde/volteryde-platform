package com.volteryde.usermanagement.service.impl;

import com.volteryde.usermanagement.model.DriverProfile;
import com.volteryde.usermanagement.model.User;
import com.volteryde.usermanagement.repository.DriverProfileRepository;
import com.volteryde.usermanagement.repository.UserRepository;
import com.volteryde.usermanagement.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DriverServiceImpl implements DriverService {

	private final UserRepository userRepository;
	private final DriverProfileRepository driverProfileRepository;

	@Override
	public DriverProfile getDriverProfile(String authId) {
		User user = userRepository.findByAuthId(authId)
				.orElseThrow(() -> new IllegalArgumentException("Driver not found for authId: " + authId));
		return driverProfileRepository.findByUser(user)
				.orElseThrow(() -> new IllegalArgumentException("Driver profile not found for user: " + user.getUserId()));
	}

	@Override
	public void updateAvailability(String authId, boolean available) {
		User user = userRepository.findByAuthId(authId)
				.orElseThrow(() -> new IllegalArgumentException("Driver not found for authId: " + authId));
		DriverProfile profile = driverProfileRepository.findByUser(user)
				.orElseThrow(() -> new IllegalArgumentException("Driver profile not found for user: " + user.getUserId()));

		// Only allow self-service toggle between ACTIVE and INACTIVE.
		// ON_TRIP and SUSPENDED are managed by the system/admin and cannot be
		// overridden by the driver.
		DriverProfile.DriverStatus current = profile.getStatus();
		if (current == DriverProfile.DriverStatus.ON_TRIP || current == DriverProfile.DriverStatus.SUSPENDED) {
			throw new IllegalStateException(
					"Availability cannot be changed while status is " + current.name());
		}

		profile.setStatus(available ? DriverProfile.DriverStatus.ACTIVE : DriverProfile.DriverStatus.INACTIVE);
		driverProfileRepository.save(profile);
	}
}
