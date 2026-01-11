package com.volteryde.usermanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

	@Bean
	public CorsFilter corsFilter() {
		CorsConfiguration config = new CorsConfiguration();

		// Allow all frontend origins locally and in production (configure more strictly
		// for prod)
		config.setAllowedOriginPatterns(Arrays.asList(
				"http://localhost:*",
				"https://*.volteryde.com",
				"https://*.volteryde.org"));

		config.setAllowedHeaders(Arrays.asList(
				"Origin",
				"Content-Type",
				"Accept",
				"Authorization",
				"X-Requested-With",
				"Access-Control-Request-Method",
				"Access-Control-Request-Headers"));

		config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

		config.setAllowCredentials(true);
		config.setMaxAge(3600L); // 1 hour

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);

		return new CorsFilter(source);
	}
}
