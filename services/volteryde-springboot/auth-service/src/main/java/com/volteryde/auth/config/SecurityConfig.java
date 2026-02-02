package com.volteryde.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Security configuration for the auth service
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder(12);
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				// SECURITY NOTE: CSRF protection is intentionally disabled because:
				// 1. This is a stateless REST API using JWT tokens (no session cookies)
				// 2. Authentication uses Authorization header, not cookies
				// 3. CSRF attacks exploit cookie-based auth which we don't use
				// See:
				// https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-when
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session
						.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// Public auth endpoints
						.requestMatchers(
								"/login",
								"/register",
								"/password/**",
								"/verify-email",
								"/refresh-token",
								"/actuator/**",
								"/actuator/health/**")
						.permitAll()
						// Everything else requires authentication
						.anyRequest().authenticated())
				.httpBasic(basic -> basic.disable())
				.formLogin(form -> form.disable());

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		// Use setAllowedOriginPatterns for flexibility with allowCredentials(true)
		configuration.setAllowedOriginPatterns(Arrays.asList(
				"http://localhost:*",
				"https://*.volteryde.org",
				"http://*.volteryde.org"));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
		configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept",
				"Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
		configuration.setExposedHeaders(Arrays.asList("Authorization"));
		configuration.setAllowCredentials(true);
		configuration.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
