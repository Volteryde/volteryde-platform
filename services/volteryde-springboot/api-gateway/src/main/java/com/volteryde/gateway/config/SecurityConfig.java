package com.volteryde.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
		// Disable CSRF for a stateless API Gateway and allow specific public endpoints
		http
				.csrf(csrf -> csrf.disable())
				.authorizeExchange(exchanges -> exchanges
						// Allow all actuator pathways (Prometheus scraping)
						.pathMatchers("/actuator/**").permitAll()
						// Allow Volteryde-API endpoints (GTFS searches, Locator)
						.pathMatchers("/api/v1/gtfs/**").permitAll()
						.pathMatchers("/api/v1/locator/**").permitAll()
						// The gateway routes other requests. Individual microservices should enforce
						// their own security
						// (JWT checks) instead of the gateway doing it, unless specifically configured.
						// We default to permitAll
						// for routing capabilities, relying on the downstream microservices to
						// authorize.
						.anyExchange().permitAll());

		return http.build();
	}
}
