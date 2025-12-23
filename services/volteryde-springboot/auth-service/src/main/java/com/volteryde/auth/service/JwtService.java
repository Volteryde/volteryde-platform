package com.volteryde.auth.service;

import com.volteryde.auth.entity.RefreshTokenEntity;
import com.volteryde.auth.entity.UserEntity;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JWT Token Service for generating and validating tokens
 */
@Service
public class JwtService {

	private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

	@Value("${spring.security.jwt.secret}")
	private String jwtSecret;

	@Value("${spring.security.jwt.expiration}")
	private Long jwtExpiration; // in milliseconds

	@Value("${spring.security.jwt.refresh-expiration}")
	private Long refreshExpiration; // in milliseconds

	private SecretKey getSigningKey() {
		byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
		// Ensure key is at least 256 bits (32 bytes) for HS256
		if (keyBytes.length < 32) {
			byte[] paddedKey = new byte[32];
			System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
			keyBytes = paddedKey;
		}
		return Keys.hmacShaKeyFor(keyBytes);
	}

	/**
	 * Generate access token for a user
	 */
	public String generateAccessToken(UserEntity user) {
		Date issuedAt = new Date();
		Date expiration = new Date(issuedAt.getTime() + jwtExpiration);

		Map<String, Object> claims = new HashMap<>();
		claims.put("email", user.getEmail());
		claims.put("firstName", user.getFirstName());
		claims.put("lastName", user.getLastName());
		claims.put("roles", user.getRoles().stream()
				.map(role -> role.getName().name())
				.collect(Collectors.toList()));

		if (user.getOrganizationId() != null) {
			claims.put("organizationId", user.getOrganizationId());
		}

		return Jwts.builder()
				.subject(user.getId())
				.claims(claims)
				.issuedAt(issuedAt)
				.expiration(expiration)
				.issuer("auth.volteryde.org")
				.signWith(getSigningKey())
				.compact();
	}

	/**
	 * Generate refresh token
	 */
	public RefreshTokenEntity generateRefreshToken(UserEntity user, String deviceInfo, String ipAddress) {
		RefreshTokenEntity refreshToken = new RefreshTokenEntity();
		refreshToken.setToken(UUID.randomUUID().toString());
		refreshToken.setUser(user);
		refreshToken.setExpiryDate(LocalDateTime.now().plusSeconds(refreshExpiration / 1000));
		refreshToken.setDeviceInfo(deviceInfo);
		refreshToken.setIpAddress(ipAddress);
		refreshToken.setRevoked(false);
		return refreshToken;
	}

	/**
	 * Get expiration time in seconds
	 */
	public Long getExpirationInSeconds() {
		return jwtExpiration / 1000;
	}

	/**
	 * Extract user ID from token
	 */
	public String extractUserId(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	/**
	 * Extract email from token
	 */
	public String extractEmail(String token) {
		Claims claims = extractAllClaims(token);
		return claims.get("email", String.class);
	}

	/**
	 * Extract roles from token
	 */
	@SuppressWarnings("unchecked")
	public List<String> extractRoles(String token) {
		Claims claims = extractAllClaims(token);
		return claims.get("roles", List.class);
	}

	/**
	 * Validate token
	 */
	public boolean validateToken(String token) {
		try {
			Jwts.parser()
					.verifyWith(getSigningKey())
					.build()
					.parseSignedClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			logger.error("Invalid JWT token: {}", e.getMessage());
			return false;
		}
	}

	/**
	 * Check if token is expired
	 */
	public boolean isTokenExpired(String token) {
		try {
			Date expiration = extractClaim(token, Claims::getExpiration);
			return expiration.before(new Date());
		} catch (Exception e) {
			return true;
		}
	}

	private <T> T extractClaim(String token, java.util.function.Function<Claims, T> claimsResolver) {
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
