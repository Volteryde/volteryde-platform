package com.volteryde.usermanagement.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.function.Function;

/**
 * Utility for validating and extracting information from JWT tokens.
 * Replicates logic from auth-service's JwtService to allow local validation.
 */
@Component
public class JwtUtil {

	private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtUtil.class);

	@Value("${spring.security.jwt.secret}")
	private String jwtSecret;

	private SecretKey getSigningKey() {
		byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < 32) {
			byte[] paddedKey = new byte[32];
			System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
			keyBytes = paddedKey;
		}
		return Keys.hmacShaKeyFor(keyBytes);
	}

	public String extractUsername(String token) {
		// In Volteryde, subject is userId, but usually we map email or subject.
		// For security context, we often set userId as Principal.
		return extractClaim(token, Claims::getSubject);
	}

	public String extractEmail(String token) {
		return extractClaim(token, claims -> claims.get("email", String.class));
	}

	public List<String> extractRoles(String token) {
		return extractClaim(token, claims -> {
			@SuppressWarnings("unchecked")
			List<String> roles = claims.get("roles", List.class);
			return roles;
		});
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parser()
					.verifyWith(getSigningKey())
					.build()
					.parseSignedClaims(token);
			return true;
		} catch (Exception e) {
			logger.error("Token validation failed: {}", e.getMessage());
			return false;
		}
	}

	public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = extractAllClaims(token);
		return claimsResolver.apply(claims);
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parser()
				.verifyWith(getSigningKey())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}
}
