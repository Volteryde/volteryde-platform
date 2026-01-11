package com.volteryde.clientauth.service;

import com.volteryde.clientauth.entity.ClientRefreshToken;
import com.volteryde.clientauth.entity.ClientUser;
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

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] paddedKey = new byte[32];
            System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
            keyBytes = paddedKey;
        }
        return Keys.hmacShaKeyFor(keyBytes);
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
                .subject(user.getId())
                .claims(claims)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .issuer(ISSUER)
                .signWith(getSigningKey())
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
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract phone from token
     */
    public String extractPhone(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("phone", String.class);
    }

    /**
     * Extract role from token
     */
    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }

    /**
     * Extract token type (CLIENT)
     */
    public String extractType(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("type", String.class);
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

    /**
     * Check if token is a client token
     */
    public boolean isClientToken(String token) {
        try {
            String type = extractType(token);
            return "CLIENT".equals(type);
        } catch (Exception e) {
            return false;
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
