package com.volteryde.usermanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/actuator/**").permitAll()
						.anyRequest().authenticated());

		// Note: In a real environment, we would configure an OAuth2 Resource Server
		// here.
		// For now, we are relying on the API Gateway to handle authentication.
		// However, EnableMethodSecurity works best when there is an Authentication
		// object in the SecurityContext.
		// We assume a filter (likely from shared-library or a custom one) will populate
		// this.
		// If not, we will need to add a simple JWT filter.

		return http.build();
	}
}
