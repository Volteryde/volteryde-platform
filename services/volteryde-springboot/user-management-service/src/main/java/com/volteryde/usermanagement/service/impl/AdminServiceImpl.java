package com.volteryde.usermanagement.service.impl;

import com.volteryde.usermanagement.dto.AdminDto;
import com.volteryde.usermanagement.model.*;
import com.volteryde.usermanagement.repository.DriverProfileRepository;
import com.volteryde.usermanagement.repository.FleetManagerProfileRepository;
import com.volteryde.usermanagement.repository.UserRepository;
import com.volteryde.usermanagement.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

	private final UserRepository userRepository;
	private final DriverProfileRepository driverProfileRepository;
	private final FleetManagerProfileRepository fleetManagerProfileRepository;
	private final com.volteryde.usermanagement.service.ActivityLogService activityLogService;

	@Override
	@Transactional
	@SuppressWarnings("null")
	public AdminDto.DriverResponse onboardDriver(AdminDto.OnboardDriverRequest request) {
		log.info("Onboarding driver: {}", request.getEmail());

		if (userRepository.existsByEmail(request.getEmail())) {
			throw new IllegalArgumentException("User with email already exists");
		}

		// 1. Create Base User
		User user = User.builder()
				.email(request.getEmail())
				.firstName(request.getFirstName())
				.lastName(request.getLastName())
				.phoneNumber(request.getPhoneNumber())
				.role(UserRole.DRIVER)
				.isActive(true)
				.build();
		User savedUser = userRepository.save(user);

		// 2. Create Driver Profile
		DriverProfile profile = DriverProfile.builder()
				.user(savedUser)
				.licenseNumber(request.getLicenseNumber())
				.yearsOfExperience(request.getYearsOfExperience())
				.status(DriverProfile.DriverStatus.INACTIVE) // Default to inactive until verified
				.build();
		DriverProfile savedProfile = driverProfileRepository.save(profile);

		// 3. Audit Log
		activityLogService.logActivity(
				null, // Actor ID (System/Support)
				"ONBOARD_DRIVER",
				"DRIVER_PROFILE",
				savedUser.getId(),
				"Onboarded driver " + request.getEmail(),
				"127.0.0.1" // Mock IP
		);

		return AdminDto.DriverResponse.builder()
				.userId(savedUser.getId())
				.profileId(savedProfile.getId())
				.fullName(savedUser.getFirstName() + " " + savedUser.getLastName())
				.licenseNumber(savedProfile.getLicenseNumber())
				.status(savedProfile.getStatus().name())
				.build();
	}

	@Override
	@Transactional
	@SuppressWarnings("null")
	public void onboardFleetManager(AdminDto.OnboardManagerRequest request) {
		log.info("Onboarding fleet manager: {}", request.getEmail());

		if (userRepository.existsByEmail(request.getEmail())) {
			throw new IllegalArgumentException("User with email already exists");
		}

		User user = User.builder()
				.email(request.getEmail())
				.firstName(request.getFirstName())
				.lastName(request.getLastName())
				.phoneNumber(request.getPhoneNumber())
				.role(UserRole.FLEET_MANAGER)
				.isActive(true)
				.build();
		User savedUser = userRepository.save(user);

		FleetManagerProfile profile = FleetManagerProfile.builder()
				.user(savedUser)
				.assignedRegion(request.getAssignedRegion())
				.hubId(request.getHubId())
				.build();
		fleetManagerProfileRepository.save(profile);

		// Audit Log
		activityLogService.logActivity(
				null,
				"ONBOARD_FLEET_MANAGER",
				"FLEET_MANAGER_PROFILE",
				savedUser.getId(),
				"Onboarded fleet manager " + request.getEmail(),
				"127.0.0.1");
	}
}
