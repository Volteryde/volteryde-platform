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
	private final com.volteryde.usermanagement.client.AuthServiceClient authServiceClient;

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
				.status(AccountStatus.ACTIVE)
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
				.status(AccountStatus.ACTIVE)
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

	@Override
	@Transactional
	@SuppressWarnings("null")
	public User createUser(AdminDto.CreateUserRequest request) {
		log.info("Creating new user: {} with role: {}", request.getEmail(), request.getRole());

		if (userRepository.existsByEmail(request.getEmail())) {
			throw new IllegalArgumentException("User with email already exists");
		}

		// 1. Generate Access ID
		UserRole userRole = UserRole.valueOf(request.getRole());
		String accessId = UserIdGenerator.generate(userRole);

		// 2. Create User in Auth Service
		try {
			// We construct a map or a generic object to pass to the Feign client
			// effectively mirroring RegisterRequest from auth-service
			java.util.Map<String, Object> authRequest = new java.util.HashMap<>();
			authRequest.put("email", request.getEmail());
			authRequest.put("password", request.getPassword());
			authRequest.put("firstName", request.getFirstName());
			authRequest.put("lastName", request.getLastName());
			authRequest.put("phoneNumber", request.getPhoneNumber());
			authRequest.put("role", request.getRole());
			authRequest.put("accessId", accessId);

			// Call auth service
			authServiceClient.register(authRequest, "AdminDashboard/1.0");
		} catch (Exception e) {
			log.error("Failed to create user in Auth Service", e);
			throw new RuntimeException("Failed to create user authentication: " + e.getMessage());
		}

		// 3. Create User Profile locally
		User user = User.builder()
				.email(request.getEmail())
				.userId(accessId) // Set generated ID
				.firstName(request.getFirstName())
				.lastName(request.getLastName())
				.phoneNumber(request.getPhoneNumber())
				// We need to map string role to UserRole enum
				.role(userRole)
				.status(AccountStatus.ACTIVE)
				.build();

		User savedUser = userRepository.save(user);

		// 3. Create Specific Profile if applicable
		if (user.getRole() == UserRole.DRIVER) {
			log.info("Creating default inactive profile for new driver: {}", user.getId());
			DriverProfile driverProfile = DriverProfile.builder()
					.user(savedUser)
					.licenseNumber("PENDING-" + savedUser.getUserId()) // Unique placeholder
					.status(DriverProfile.DriverStatus.INACTIVE)
					.yearsOfExperience(0)
					.build();
			driverProfileRepository.save(driverProfile);
		} else if (user.getRole() == UserRole.FLEET_MANAGER) {
			log.info("Creating default profile for new fleet manager: {}", user.getId());
			FleetManagerProfile managerProfile = FleetManagerProfile.builder()
					.user(savedUser)
					// Region and Hub can be null/empty initially for managers
					.build();
			fleetManagerProfileRepository.save(managerProfile);
		}

		// 4. Audit Log
		activityLogService.logActivity(
				null,
				"CREATE_USER",
				"USER",
				savedUser.getId(),
				"Created user " + request.getEmail() + " as " + request.getRole(),
				"127.0.0.1");

		return savedUser;
	}
}
