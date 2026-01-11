package com.volteryde.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

/**
 * CORS configuration for cross-domain requests
 */
@Configuration
public class CorsConfig {

	@Bean
	public CorsFilter corsFilter() {
		CorsConfiguration config = new CorsConfiguration();

		// Allow credentials
		config.setAllowCredentials(true);

		// Allow all Volteryde domains
		config.setAllowedOriginPatterns(Arrays.asList(
				"http://localhost:*",
				"http://localhost:4000",
				"http://localhost:4001",
				"http://localhost:4002",
				"http://localhost:4003",
				"http://localhost:4004",
				"http://localhost:4005",
				"https://localhost:*",
				"https://*.volteryde.org",
				"https://volteryde.org"));

		// Allow common methods
		config.setAllowedMethods(Arrays.asList(
				"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

		// Allow common headers
		config.setAllowedHeaders(Arrays.asList(
				"Authorization",
				"Content-Type",
				"Accept",
				"Origin",
				"X-Requested-With"));

		// Expose custom headers
		config.setExposedHeaders(Arrays.asList(
				"Authorization",
				"X-Total-Count"));

		// Cache preflight for 1 hour
		config.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);

		return new CorsFilter(source);
	}
}
