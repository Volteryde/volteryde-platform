package com.volteryde.auth.config;

import com.volteryde.auth.entity.RoleEntity;
import com.volteryde.auth.entity.RoleEntity.UserRole;
import com.volteryde.auth.entity.UserEntity;
import com.volteryde.auth.repository.RoleRepository;
import com.volteryde.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

/**
 * Data initialization configuration
 * Seeds initial roles and default admin user
 */
@Configuration
public class DataInitConfig {

	private static final Logger logger = LoggerFactory.getLogger(DataInitConfig.class);

	@Bean
	public CommandLineRunner initData(RoleRepository roleRepository, UserRepository userRepository,
			PasswordEncoder passwordEncoder) {
		return args -> {
			logger.info("Initializing data...");

			// 1. Initialize Roles
			for (UserRole role : UserRole.values()) {
				if (!roleRepository.existsByName(role)) {
					RoleEntity roleEntity = new RoleEntity(role, getDescription(role));
					roleRepository.save(roleEntity);
					logger.info("Created role: {}", role);
				}
			}

			// 2. Initialize Default Admin
			String adminEmail = "test@volteryde.com";
			if (!userRepository.findByEmail(adminEmail).isPresent()) {
				logger.info("Creating default admin user...");

				RoleEntity adminRole = roleRepository.findByName(UserRole.ADMIN)
						.orElseThrow(() -> new RuntimeException("Error: Role is not found."));

				UserEntity admin = new UserEntity();
				admin.setEmail(adminEmail);
				admin.setPasswordHash(passwordEncoder.encode("P@s$1234"));
				admin.setFirstName("System");
				admin.setLastName("Admin");
				admin.setPhoneNumber("+0000000000");
				admin.setAccessId("VR-A001");
				admin.setEnabled(true);
				admin.setEmailVerified(true);

				Set<RoleEntity> roles = new HashSet<>();
				roles.add(adminRole);
				admin.setRoles(roles);

				userRepository.save(admin);
				logger.info("Default admin user created: {} / P@s$1234 (Access ID: VR-A001)", adminEmail);
			}

			logger.info("Data initialization complete");
		};
	}

	private String getDescription(UserRole role) {
		return switch (role) {
			case SUPER_ADMIN -> "Full system access with all permissions";
			case ADMIN -> "Administrative access with most permissions";
			case DISPATCHER -> "Dispatch and routing management";
			case SUPPORT_AGENT -> "Customer support and ticket management";
			case PARTNER -> "Business intelligence and partner portal access";
			case DRIVER -> "Driver app access and route management";
			case FLEET_MANAGER -> "Fleet and vehicle management";

		};
	}
}
