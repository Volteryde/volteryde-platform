package com.volteryde.auth.config;

import com.volteryde.auth.entity.RoleEntity;
import com.volteryde.auth.entity.RoleEntity.UserRole;
import com.volteryde.auth.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Data initialization configuration
 * Seeds initial roles into the database
 */
@Configuration
public class DataInitConfig {

	private static final Logger logger = LoggerFactory.getLogger(DataInitConfig.class);

	@Bean
	public CommandLineRunner initRoles(RoleRepository roleRepository) {
		return args -> {
			logger.info("Initializing roles...");

			for (UserRole role : UserRole.values()) {
				if (!roleRepository.existsByName(role)) {
					RoleEntity roleEntity = new RoleEntity(role, getDescription(role));
					roleRepository.save(roleEntity);
					logger.info("Created role: {}", role);
				}
			}

			logger.info("Role initialization complete");
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
