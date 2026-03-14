package com.volteryde.clientauth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis-backed JWT access token blacklist.
 *
 * Key pattern : JWT:BL:{jti}
 * TTL         : set to the token's remaining lifetime (seconds) so entries
 *               expire automatically — no unbounded growth.
 *
 * Graceful degradation: if Redis is unavailable, log the error and continue
 * (the refresh token is still revoked, limiting the attack surface).
 */
@Service
public class TokenBlacklistService {

    private static final Logger logger = LoggerFactory.getLogger(TokenBlacklistService.class);
    private static final String PREFIX = "JWT:BL:";

    private final StringRedisTemplate redis;

    public TokenBlacklistService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Add a JWT ID to the blacklist with the given TTL.
     *
     * @param jti        the jti claim from the access token
     * @param ttlSeconds remaining lifetime of the token in seconds
     */
    public void blacklist(String jti, long ttlSeconds) {
        if (ttlSeconds <= 0) {
            // Token is already expired — no need to store
            return;
        }
        try {
            redis.opsForValue().set(PREFIX + jti, "1", Duration.ofSeconds(ttlSeconds));
            logger.debug("Blacklisted JWT jti={} ttl={}s", jti, ttlSeconds);
        } catch (Exception e) {
            logger.error("Failed to blacklist JWT jti={}: {}", jti, e.getMessage());
        }
    }

    /**
     * Check whether a JWT ID has been blacklisted.
     *
     * @param jti the jti claim from the access token
     * @return true if the token is blacklisted (revoked)
     */
    public boolean isBlacklisted(String jti) {
        if (jti == null) {
            return false;
        }
        try {
            return Boolean.TRUE.equals(redis.hasKey(PREFIX + jti));
        } catch (Exception e) {
            logger.error("Failed to check blacklist for jti={}: {}", jti, e.getMessage());
            return false; // Fail open — prefer availability over strict revocation on Redis outage
        }
    }
}
