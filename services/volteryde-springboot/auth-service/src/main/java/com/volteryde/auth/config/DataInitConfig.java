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

	private static final String ADMIN_EMAIL     = "admin@volteryde.com";
	private static final String ADMIN_ACCESS_ID = "VR-A293746";

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

			// 2. Initialize Default Super Admin
			RoleEntity superAdminRole = roleRepository.findByName(UserRole.SUPER_ADMIN)
					.orElseThrow(() -> new RuntimeException("Error: SUPER_ADMIN role not found."));
			RoleEntity adminRole = roleRepository.findByName(UserRole.ADMIN)
					.orElseThrow(() -> new RuntimeException("Error: ADMIN role not found."));

			var existing = userRepository.findByEmail(ADMIN_EMAIL);
			if (existing.isPresent()) {
				// Self-heal: fix access ID if it differs from the canonical one
				UserEntity admin = existing.get();
				if (!ADMIN_ACCESS_ID.equals(admin.getAccessId())) {
					admin.setAccessId(ADMIN_ACCESS_ID);
					userRepository.save(admin);
					logger.info("Fixed admin access ID → {}", ADMIN_ACCESS_ID);
				}
			} else {
				logger.info("Creating default super admin user...");

				UserEntity admin = new UserEntity();
				admin.setEmail(ADMIN_EMAIL);
				admin.setPasswordHash(passwordEncoder.encode("V0lt3ryd3@Adm1n!2026"));
				admin.setFirstName("VolteRyde");
				admin.setLastName("Admin");
				admin.setPhoneNumber("+233000000000");
				admin.setAccessId(ADMIN_ACCESS_ID);
				admin.setEnabled(true);
				admin.setEmailVerified(true);

				Set<RoleEntity> roles = new HashSet<>();
				roles.add(superAdminRole);
				roles.add(adminRole);
				admin.setRoles(roles);

				userRepository.save(admin);
				logger.info("Default super admin created: {} (Access ID: {})", ADMIN_EMAIL, ADMIN_ACCESS_ID);
			}

			logger.info("Data initialization complete");
		};
	}

	private String getDescription(UserRole role) {
		return switch (role) {
			case SUPER_ADMIN -> "Full system access with all permissions";
			case ADMIN -> "Administrative access with most permissions";
			case DISPATCHER -> "Dispatch and routing management";
			case CUSTOMER_SUPPORT -> "External customer care for end-users";
			case SYSTEM_SUPPORT -> "Internal system support for drivers and operations";
			case PARTNER -> "Business intelligence and partner portal access";
			case DRIVER -> "Driver app access and route management";
			case FLEET_MANAGER -> "Fleet and vehicle management";
		};
	}
}
