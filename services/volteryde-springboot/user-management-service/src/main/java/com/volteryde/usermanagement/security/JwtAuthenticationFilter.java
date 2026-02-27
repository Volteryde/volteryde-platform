package com.volteryde.usermanagement.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filter to validate JWT tokens and populate SecurityContext.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);

	private final JwtUtil jwtUtil;

	public JwtAuthenticationFilter(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	@Override
	protected void doFilterInternal(
			@NonNull HttpServletRequest request,
			@NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {
		final String authHeader = request.getHeader("Authorization");
		final String jwt;

		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			logger.trace("No Bearer token found in request headers");
			filterChain.doFilter(request, response);
			return;
		}

		jwt = authHeader.substring(7);

		try {
			if (jwtUtil.validateToken(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
				// Extract user details
				String userId = jwtUtil.extractUsername(jwt); // Subject is userId
				// String email = jwtUtil.extractEmail(jwt);
				List<String> roles = jwtUtil.extractRoles(jwt);

				logger.info("Valid JWT for userId: {}, roles: {}", userId, roles);

				// Convert roles to Authorities
				// Spring Security matches 'hasAnyAuthority("ADMIN")' to authority string
				// "ADMIN"
				// If configuration expects "ROLE_ADMIN", we would prefix here.
				// But Volteryde roles seem to be "ADMIN", "DRIVER" etc. without prefix in
				// token.
				// PreAuthorize uses hasAnyAuthority which checks exact string match.
				List<SimpleGrantedAuthority> authorities = roles.stream()
						.map(SimpleGrantedAuthority::new)
						.collect(Collectors.toList());

				UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
						userId, // Principal is userId
						null,
						authorities);

				authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(authToken);
				logger.info("SecurityContext populated for user: {}", userId);
			} else {
				logger.warn("Token validation failed or context already populated");
			}
		} catch (Exception e) {
			// Token invalid or expired, do not set authentication
			// Request will proceed as anonymous
			logger.error("Error setting user authentication", e);
		}

		filterChain.doFilter(request, response);
	}
}
