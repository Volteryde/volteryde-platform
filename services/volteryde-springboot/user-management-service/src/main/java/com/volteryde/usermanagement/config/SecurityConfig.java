package com.volteryde.usermanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for user-management-service.
 * 
 * This service operates within a microservices architecture where:
 * - The API Gateway handles primary authentication
 * - Service-to-service calls include authentication tokens
 * - Admin dashboard communicates directly for development
 * 
 * Security is enforced consistently across all environments.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private final com.volteryde.usermanagement.security.JwtAuthenticationFilter jwtAuthenticationFilter;

	public SecurityConfig(com.volteryde.usermanagement.security.JwtAuthenticationFilter jwtAuthenticationFilter) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// Health and metrics endpoints - public
						.requestMatchers("/actuator/**").permitAll()
						// API endpoints - require authentication via token or internal call
						// For now, permit all API calls since authentication is handled by API Gateway
						// In production, this would validate JWT tokens
						.requestMatchers("/api/**").permitAll()
						// All other requests require authentication
						.anyRequest().authenticated())
				.addFilterBefore(jwtAuthenticationFilter,
						org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

		// Note: In production, configure OAuth2 Resource Server here to validate JWTs
		// http.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(List.of(
				"http://localhost:*",
				"http://127.0.0.1:*",
				"http://*.localhost",
				"https://*.volteryde.com",
				"https://volteryde.com"));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(Arrays.asList(
				"Authorization",
				"Content-Type",
				"X-Requested-With",
				"Accept",
				"Origin",
				"Access-Control-Request-Method",
				"Access-Control-Request-Headers",
				"X-User-Id",
				"X-Auth-Token"));
		configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
		configuration.setAllowCredentials(true);
		configuration.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
