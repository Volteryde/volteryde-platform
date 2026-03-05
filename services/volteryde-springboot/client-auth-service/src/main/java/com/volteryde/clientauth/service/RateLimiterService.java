package com.volteryde.clientauth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Rate Limiter Service — Redis-backed, distributed across all K8s pods.
 *
 * OTP limits:
 *   - 3 per phone per 5 min
 *   - 10 per phone per minute (burst)
 *   - 20 per IP per minute → IP blacklist (2 h first, 100 h repeat)
 *
 * Login limits:
 *   - 5 per email per 15 min (wrong password counter)
 *   - 20 per IP per 15 min
 *   - Account lockout after 10 consecutive failures (30 min)
 *
 * Registration limits:
 *   - 10 per IP per hour
 *
 * Social login limits:
 *   - 30 per IP per hour
 *
 * Graceful degradation: if Redis is unreachable, log an error and allow the
 * request through so the auth service stays available.
 */
@Service
public class RateLimiterService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimiterService.class);

    // ── Key prefixes ────────────────────────────────────────────────────────────
    private static final String PFX                = "RL:";
    private static final String OTP_MIN            = PFX + "OTP:MIN:";
    private static final String OTP_5MIN           = PFX + "OTP:5MIN:";
    private static final String OTP_IP             = PFX + "OTP:IP:";
    private static final String EMAIL_OTP_5MIN     = PFX + "EMAILOTP:5MIN:";
    private static final String IP_BLACKLIST       = PFX + "IP:BL:";
    private static final String IP_BL_COUNT        = PFX + "IP:BL:CNT:";
    private static final String LOGIN_EMAIL_FAIL   = PFX + "LOGIN:FAIL:EMAIL:";
    private static final String LOGIN_IP           = PFX + "LOGIN:IP:";
    private static final String LOGIN_LOCK         = PFX + "LOGIN:LOCK:";
    private static final String REG_IP             = PFX + "REG:IP:";
    private static final String SOCIAL_IP          = PFX + "SOCIAL:IP:";

    // ── Limits ──────────────────────────────────────────────────────────────────
    private static final int OTP_MAX_PER_5MIN         = 3;
    private static final int OTP_MAX_PER_MIN          = 10;
    private static final int OTP_IP_MAX_PER_MIN       = 20;
    private static final int IP_BL_HOURS_FIRST        = 2;
    private static final int IP_BL_HOURS_REPEAT       = 100;

    private static final int LOGIN_EMAIL_MAX          = 5;   // per 15 min window
    private static final int LOGIN_IP_MAX             = 20;  // per 15 min window
    private static final int LOGIN_LOCK_THRESHOLD     = 10;  // consecutive failures → lock
    private static final int LOGIN_LOCK_MINUTES       = 30;
    private static final int LOGIN_WINDOW_MINUTES     = 15;

    private static final int REG_IP_MAX               = 10;  // per hour
    private static final int SOCIAL_IP_MAX            = 30;  // per hour

    private final StringRedisTemplate redis;

    public RateLimiterService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // OTP rate limiting (preserves existing public API)
    // ════════════════════════════════════════════════════════════════════════════

    /** Check + record OTP attempt — throws {@code RuntimeException} if over limit. */
    public void checkAndRecordOtp(String phone, String ipAddress) {
        try {
            enforceIpBlacklist(ipAddress);
            enforceCounter(OTP_5MIN + phone,  OTP_MAX_PER_5MIN, Duration.ofMinutes(5),
                    "Too many OTP requests. Please wait %d minute(s) before requesting another code. " +
                    "You can request up to " + OTP_MAX_PER_5MIN + " codes every 5 minutes.");
            enforceCounter(OTP_MIN + phone,   OTP_MAX_PER_MIN,  Duration.ofMinutes(1),
                    "Too many OTP requests. Please slow down.");
            if (ipAddress != null && !ipAddress.isBlank()) {
                long ipCount = increment(OTP_IP + ipAddress, Duration.ofMinutes(1));
                if (ipCount > OTP_IP_MAX_PER_MIN) {
                    blacklistIp(ipAddress);
                    logger.error("IP {} blacklisted for exceeding OTP rate limit", maskIp(ipAddress));
                    throw new RuntimeException("Your IP has been temporarily blocked due to suspicious activity.");
                }
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Redis error in checkAndRecordOtp — allowing request: {}", e.getMessage());
        }
    }

    /** Check + record email OTP attempt — throws if over limit. */
    public void checkAndRecordEmailOtp(String email, String ipAddress) {
        try {
            enforceIpBlacklist(ipAddress);
            enforceCounter(EMAIL_OTP_5MIN + email, OTP_MAX_PER_5MIN, Duration.ofMinutes(5),
                    "Too many OTP requests. Please wait %d minute(s) before requesting another code.");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Redis error in checkAndRecordEmailOtp — allowing request: {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Login rate limiting + account lockout
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Call BEFORE credential check. Blocks IPs and locked accounts.
     * Call {@link #recordLoginFailure} on bad credentials.
     * Call {@link #recordLoginSuccess} on successful auth.
     */
    public void checkLoginAllowed(String email, String ipAddress) {
        try {
            // 1. IP limit (broad — blocks credential stuffing)
            enforceCounter(LOGIN_IP + ipAddress, LOGIN_IP_MAX, Duration.ofMinutes(LOGIN_WINDOW_MINUTES),
                    "Too many login attempts from your network. Please try again in %d minute(s).");

            // 2. Account lockout (from consecutive failures)
            String lockKey = LOGIN_LOCK + email.toLowerCase();
            String locked  = redis.opsForValue().get(lockKey);
            if (locked != null) {
                Long ttlSec = redis.getExpire(lockKey);
                long minsLeft = ttlSec != null ? (ttlSec / 60) + 1 : LOGIN_LOCK_MINUTES;
                throw new RuntimeException(
                        "Account temporarily locked due to too many failed attempts. " +
                        "Please try again in " + minsLeft + " minute(s).");
            }

            // 3. Per-email failure window (softer — stops targeted brute force)
            String failKey = LOGIN_EMAIL_FAIL + email.toLowerCase();
            String val     = redis.opsForValue().get(failKey);
            int    fails   = val != null ? Integer.parseInt(val) : 0;
            if (fails >= LOGIN_EMAIL_MAX) {
                Long ttlSec = redis.getExpire(failKey);
                long minsLeft = ttlSec != null ? (ttlSec / 60) + 1 : LOGIN_WINDOW_MINUTES;
                throw new RuntimeException(
                        "Too many failed login attempts. Please try again in " + minsLeft + " minute(s).");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Redis error in checkLoginAllowed — allowing request: {}", e.getMessage());
        }
    }

    /** Record a failed login attempt. Locks the account after {@code LOGIN_LOCK_THRESHOLD} consecutive failures. */
    public void recordLoginFailure(String email, String ipAddress) {
        try {
            String normEmail = email.toLowerCase();
            long   failures  = increment(LOGIN_EMAIL_FAIL + normEmail, Duration.ofMinutes(LOGIN_WINDOW_MINUTES));
            logger.warn("Failed login for email {} from IP {} (failure #{}/{})",
                    maskEmail(normEmail), maskIp(ipAddress), failures, LOGIN_LOCK_THRESHOLD);

            if (failures >= LOGIN_LOCK_THRESHOLD) {
                redis.opsForValue().set(LOGIN_LOCK + normEmail, "1",
                        Duration.ofMinutes(LOGIN_LOCK_MINUTES));
                logger.error("Account {} locked for {} minutes after {} consecutive failures",
                        maskEmail(normEmail), LOGIN_LOCK_MINUTES, failures);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Redis error in recordLoginFailure: {}", e.getMessage());
        }
    }

    /** Clear failure counters after a successful login. */
    public void recordLoginSuccess(String email) {
        try {
            String normEmail = email.toLowerCase();
            redis.delete(LOGIN_EMAIL_FAIL + normEmail);
            redis.delete(LOGIN_LOCK + normEmail);
        } catch (Exception e) {
            logger.error("Redis error in recordLoginSuccess: {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Registration rate limiting
    // ════════════════════════════════════════════════════════════════════════════

    /** Enforce IP-based registration limit (10 per hour). */
    public void checkAndRecordRegister(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) return;
        try {
            enforceIpBlacklist(ipAddress);
            enforceCounter(REG_IP + ipAddress, REG_IP_MAX, Duration.ofHours(1),
                    "Too many account registrations from your network. Please try again in %d minute(s).");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Redis error in checkAndRecordRegister — allowing request: {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Social login rate limiting
    // ════════════════════════════════════════════════════════════════════════════

    /** Enforce IP-based social login limit (30 per hour). */
    public void checkAndRecordSocialLogin(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) return;
        try {
            enforceIpBlacklist(ipAddress);
            enforceCounter(SOCIAL_IP + ipAddress, SOCIAL_IP_MAX, Duration.ofHours(1),
                    "Too many requests from your network. Please try again in %d minute(s).");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Redis error in checkAndRecordSocialLogin — allowing request: {}", e.getMessage());
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Legacy API (kept for backward compatibility)
    // ════════════════════════════════════════════════════════════════════════════

    public boolean isOtpAllowed(String phone, String ipAddress) {
        try {
            if (isIpBlacklisted(ipAddress)) return false;
            String v5 = redis.opsForValue().get(OTP_5MIN + phone);
            if (v5 != null && Integer.parseInt(v5) >= OTP_MAX_PER_5MIN) return false;
            String vm = redis.opsForValue().get(OTP_MIN + phone);
            if (vm != null && Integer.parseInt(vm) >= OTP_MAX_PER_MIN) return false;
            return true;
        } catch (Exception e) {
            logger.error("Redis error in isOtpAllowed — allowing: {}", e.getMessage());
            return true;
        }
    }

    public boolean isIpBlacklisted(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) return false;
        try {
            return Boolean.TRUE.equals(redis.hasKey(IP_BLACKLIST + ipAddress));
        } catch (Exception e) {
            logger.error("Redis error in isIpBlacklisted — assuming not blacklisted: {}", e.getMessage());
            return false;
        }
    }

    public void unblockIp(String ipAddress) {
        try {
            redis.delete(IP_BLACKLIST + ipAddress);
            logger.info("IP {} manually unblocked", maskIp(ipAddress));
        } catch (Exception e) {
            logger.error("Redis error in unblockIp: {}", e.getMessage());
        }
    }

    public int getRemainingOtpAttempts(String phone) {
        try {
            String v = redis.opsForValue().get(OTP_5MIN + phone);
            return Math.max(0, OTP_MAX_PER_5MIN - (v != null ? Integer.parseInt(v) : 0));
        } catch (Exception e) {
            return OTP_MAX_PER_5MIN;
        }
    }

    public long getSecondsUntilOtpReset(String phone) {
        try {
            Long ttl = redis.getExpire(OTP_5MIN + phone);
            return ttl != null && ttl > 0 ? ttl : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    /** @deprecated Use {@link #checkAndRecordOtp(String, String)} directly. */
    @Deprecated
    public void checkAndRecord(String identifier, String action) {
        if ("OTP_SEND".equalsIgnoreCase(action)) {
            checkAndRecordOtp(identifier, null);
        }
    }

    /** @deprecated Use typed methods. */
    @Deprecated
    public boolean isAllowed(String identifier, String action) { return true; }

    /** @deprecated Use typed methods. */
    @Deprecated
    public void recordAttempt(String identifier, String action) { /* no-op */ }

    /** @deprecated Use typed methods. */
    @Deprecated
    public int getRemainingAttempts(String identifier, String action) {
        if ("OTP_SEND".equalsIgnoreCase(action)) return getRemainingOtpAttempts(identifier);
        return 5;
    }

    /** @deprecated Use typed methods. */
    @Deprecated
    public long getSecondsUntilReset(String identifier, String action) {
        if ("OTP_SEND".equalsIgnoreCase(action)) return getSecondsUntilOtpReset(identifier);
        return 0;
    }

    /** No-op — Redis TTLs handle expiry automatically. */
    public void cleanup() { /* Redis handles expiry via TTL */ }

    // ════════════════════════════════════════════════════════════════════════════
    // Internal helpers
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Atomically increment a counter. Sets TTL only on first increment so the
     * window is fixed from the first request.
     */
    private long increment(String key, Duration ttl) {
        Long count = redis.opsForValue().increment(key);
        if (count == null) count = 1L;
        if (count == 1) redis.expire(key, ttl);
        return count;
    }

    /**
     * Increment {@code key} and throw if the new count exceeds {@code max}.
     * The error message may contain one {@code %d} placeholder for remaining minutes.
     */
    private void enforceCounter(String key, int max, Duration ttl, String messageTemplate) {
        long count = increment(key, ttl);
        if (count > max) {
            Long ttlSec  = redis.getExpire(key);
            long minsLeft = ttlSec != null && ttlSec > 0 ? (ttlSec / 60) + 1 : (ttl.toMinutes());
            String msg = messageTemplate.contains("%d")
                    ? String.format(messageTemplate, minsLeft)
                    : messageTemplate;
            throw new RuntimeException(msg);
        }
    }

    private void enforceIpBlacklist(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) return;
        try {
            if (Boolean.TRUE.equals(redis.hasKey(IP_BLACKLIST + ipAddress))) {
                Long ttlSec   = redis.getExpire(IP_BLACKLIST + ipAddress);
                long hoursLeft = ttlSec != null && ttlSec > 0 ? (ttlSec / 3600) + 1 : IP_BL_HOURS_FIRST;
                logger.warn("Blocked request from blacklisted IP: {}", maskIp(ipAddress));
                throw new RuntimeException(
                        "Your IP has been temporarily blocked due to suspicious activity. " +
                        "Please try again in " + hoursLeft + " hour(s).");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Redis error checking IP blacklist: {}", e.getMessage());
        }
    }

    private void blacklistIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) return;
        try {
            String countKey = IP_BL_COUNT + ipAddress;
            Long   offenses = redis.opsForValue().increment(countKey);
            if (offenses == null) offenses = 1L;
            // Don't expire the offense counter so repeat offenses are tracked long-term
            int hours = (offenses > 1) ? IP_BL_HOURS_REPEAT : IP_BL_HOURS_FIRST;
            redis.opsForValue().set(IP_BLACKLIST + ipAddress, String.valueOf(offenses),
                    Duration.ofHours(hours));
            logger.error("IP {} blacklisted for {} hours (offense #{})",
                    maskIp(ipAddress), hours, offenses);
        } catch (Exception e) {
            logger.error("Redis error blacklisting IP: {}", e.getMessage());
        }
    }

    // ── Masking helpers ─────────────────────────────────────────────────────────

    private String maskIp(String ip) {
        if (ip == null || ip.isBlank()) return "unknown";
        int dot = ip.indexOf('.');
        return dot > 0 ? ip.substring(0, dot) + ".***.***.***" : ip.substring(0, Math.min(4, ip.length())) + "***";
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int at = email.indexOf('@');
        return (at <= 2 ? "***" : email.substring(0, 2) + "***") + email.substring(at);
    }
}
