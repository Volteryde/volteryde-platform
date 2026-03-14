package com.volteryde.clientauth.service;

import com.volteryde.clientauth.entity.ClientRefreshToken;
import com.volteryde.clientauth.entity.ClientUser;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * JWT Service for Client Authentication
 *
 * Generates and validates JWT tokens for mobile/external clients
 */
@Service
public class ClientJwtService {

    private static final Logger logger = LoggerFactory.getLogger(ClientJwtService.class);
    private static final String ISSUER = "client-auth.volteryde.org";

    @Value("${spring.security.jwt.secret}")
    private String jwtSecret;

    @Value("${spring.security.jwt.expiration}")
    private Long jwtExpiration;

    @Value("${spring.security.jwt.refresh-expiration}")
    private Long refreshExpiration;

    // Cached once at startup — avoids rebuilding the key on every JWT operation
    private SecretKey signingKey;

    @PostConstruct
    private void init() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] paddedKey = new byte[32];
            System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
            keyBytes = paddedKey;
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private SecretKey getSigningKey() {
        return signingKey;
    }

    /**
     * Generate access token for a client user
     */
    public String generateAccessToken(ClientUser user) {
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + jwtExpiration);

        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "CLIENT");
        claims.put("phone", user.getPhone());
        claims.put("role", user.getRole().name());

        if (user.getEmail() != null) {
            claims.put("email", user.getEmail());
        }
        if (user.getFirstName() != null) {
            claims.put("firstName", user.getFirstName());
        }
        if (user.getLastName() != null) {
            claims.put("lastName", user.getLastName());
        }

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getId())
                .claims(claims)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .issuer(ISSUER)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generate a short-lived 2FA challenge token (5 min).
     * scope = "2FA_CHALLENGE" when user has 2FA enabled.
     * scope = "2FA_SETUP_REQUIRED" when admin must set up 2FA before login completes.
     */
    public String generate2FaChallengeToken(String userId, String scope) {
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + 300_000); // 5 minutes
        return Jwts.builder()
                .subject(userId)
                .claim("scope", scope)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .issuer(ISSUER)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generate refresh token
     */
    public ClientRefreshToken generateRefreshToken(ClientUser user, String deviceInfo, String ipAddress) {
        ClientRefreshToken refreshToken = new ClientRefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000));
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
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extract phone from token
     */
    public String extractPhone(String token) {
        return extractAllClaims(token).get("phone", String.class);
    }

    /**
     * Extract role from token
     */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /**
     * Extract token type (CLIENT)
     */
    public String extractType(String token) {
        return extractAllClaims(token).get("type", String.class);
    }

    /**
     * Validate token and return all claims in a single parse.
     * Returns empty Optional for invalid/expired tokens.
     * Use this instead of calling validateToken() + individual extractors separately.
     */
    public Optional<Claims> extractValidClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("Invalid JWT token: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Validate token
     */
    public boolean validateToken(String token) {
        return extractValidClaims(token).isPresent();
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractAllClaims(token).getExpiration();
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Check if token is a client token
     */
    public boolean isClientToken(String token) {
        try {
            return "CLIENT".equals(extractType(token));
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
