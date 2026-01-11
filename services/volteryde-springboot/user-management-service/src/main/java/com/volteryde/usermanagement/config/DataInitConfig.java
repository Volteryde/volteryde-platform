package com.volteryde.usermanagement.config;

import com.volteryde.usermanagement.model.AccountStatus;
import com.volteryde.usermanagement.model.User;
import com.volteryde.usermanagement.model.UserRole;
import com.volteryde.usermanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitConfig {

	private final UserRepository userRepository;

	@SuppressWarnings("null")
	@Bean
	public CommandLineRunner initData() {
		return args -> {
			log.info("Initializing user management data...");

			String adminEmail = "test@volteryde.com";
			if (!userRepository.existsByEmail(adminEmail)) {
				log.info("Seeding default admin user...");

				User admin = User.builder()
						.email(adminEmail)
						.firstName("System")
						.lastName("Admin")
						.phoneNumber("+0000000000")
						.role(UserRole.ADMIN)
						.status(AccountStatus.ACTIVE)
						.userId("VR-A001") // Match the access ID from auth-service for consistency visually
						.build();

				userRepository.save(admin);
				log.info("Default admin user seeded: {}", adminEmail);
			} else {
				log.info("Default admin user already exists.");
			}
		};
	}
}
