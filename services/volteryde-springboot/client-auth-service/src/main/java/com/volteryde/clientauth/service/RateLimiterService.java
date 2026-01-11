package com.volteryde.clientauth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiter Service
 * 
 * Provides sophisticated rate limiting for OTP requests to prevent abuse.
 * 
 * OTP Rate Limiting Rules:
 * 1. Per phone: 3 attempts within 5 minutes
 * 2. Per phone: Additional cap of 10 attempts per minute
 * 3. Per IP: If exceeds 20 OTP requests in 1 minute, blacklist for 2 hours
 * 4. Per IP: If same IP triggers limit again after 2-hour window, extend block to 100 hours
 * 
 * Uses in-memory storage (replace with Redis in production for distributed setup)
 */
@Service
public class RateLimiterService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimiterService.class);

    // ==================== OTP Rate Limiting Configuration ====================
    
    // Per-phone limits
    private static final int OTP_MAX_PER_5_MIN = 3;       // 3 attempts per 5 minutes
    private static final int OTP_WINDOW_MINUTES = 5;
    private static final int OTP_MAX_PER_MINUTE = 10;     // Additional cap: 10 per minute
    
    // Per-IP limits (abuse prevention)
    private static final int IP_OTP_MAX_PER_MINUTE = 20;  // 20 requests per minute triggers blacklist
    private static final int IP_BLACKLIST_HOURS_FIRST = 2;        // First offense: 2 hours
    private static final int IP_BLACKLIST_HOURS_REPEAT = 100;     // Repeat offense: 100 hours
    
    // General rate limiting (for other actions)
    private static final int MAX_GENERAL_REQUESTS = 5;
    private static final int GENERAL_WINDOW_MINUTES = 1;

    // In-memory storage (use Redis in production)
    private final Map<String, RateLimitEntry> rateLimits = new ConcurrentHashMap<>();
    private final Map<String, IpBlacklistEntry> ipBlacklist = new ConcurrentHashMap<>();

    /**
     * Check if an OTP action is allowed for the given phone and IP.
     * This is the main entry point for OTP rate limiting.
     */
    public boolean isOtpAllowed(String phone, String ipAddress) {
        // Check 1: Is IP blacklisted?
        if (isIpBlacklisted(ipAddress)) {
            logger.warn("IP {} is blacklisted for OTP requests", maskIp(ipAddress));
            return false;
        }
        
        // Check 2: Per-minute rate for phone (10 per minute cap)
        String phoneMinuteKey = buildKey(phone, "OTP_MINUTE");
        RateLimitEntry phoneMinuteEntry = rateLimits.get(phoneMinuteKey);
        if (phoneMinuteEntry != null && !phoneMinuteEntry.isExpired() && phoneMinuteEntry.getCount() >= OTP_MAX_PER_MINUTE) {
            logger.warn("Phone {} exceeded per-minute OTP limit", maskPhone(phone));
            return false;
        }
        
        // Check 3: Per-5-minute rate for phone (3 per 5 minutes)
        String phone5MinKey = buildKey(phone, "OTP_5MIN");
        RateLimitEntry phone5MinEntry = rateLimits.get(phone5MinKey);
        if (phone5MinEntry != null && !phone5MinEntry.isExpired() && phone5MinEntry.getCount() >= OTP_MAX_PER_5_MIN) {
            logger.warn("Phone {} exceeded 5-minute OTP limit", maskPhone(phone));
            return false;
        }
        
        // Check 4: IP rate (20 per minute before blacklist)
        String ipMinuteKey = buildKey(ipAddress, "IP_OTP_MINUTE");
        RateLimitEntry ipEntry = rateLimits.get(ipMinuteKey);
        if (ipEntry != null && !ipEntry.isExpired() && ipEntry.getCount() >= IP_OTP_MAX_PER_MINUTE) {
            // Blacklist this IP
            blacklistIp(ipAddress);
            logger.error("IP {} blacklisted for exceeding OTP rate limit", maskIp(ipAddress));
            return false;
        }
        
        return true;
    }

    /**
     * Record an OTP attempt for both phone and IP.
     */
    public void recordOtpAttempt(String phone, String ipAddress) {
        LocalDateTime now = LocalDateTime.now();
        
        // Record phone per-minute counter
        String phoneMinuteKey = buildKey(phone, "OTP_MINUTE");
        rateLimits.compute(phoneMinuteKey, (k, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new RateLimitEntry(1, now.plusMinutes(1));
            }
            existing.incrementCount();
            return existing;
        });
        
        // Record phone per-5-minute counter
        String phone5MinKey = buildKey(phone, "OTP_5MIN");
        rateLimits.compute(phone5MinKey, (k, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new RateLimitEntry(1, now.plusMinutes(OTP_WINDOW_MINUTES));
            }
            existing.incrementCount();
            return existing;
        });
        
        // Record IP per-minute counter
        if (ipAddress != null && !ipAddress.isEmpty()) {
            String ipMinuteKey = buildKey(ipAddress, "IP_OTP_MINUTE");
            rateLimits.compute(ipMinuteKey, (k, existing) -> {
                if (existing == null || existing.isExpired()) {
                    return new RateLimitEntry(1, now.plusMinutes(1));
                }
                existing.incrementCount();
                return existing;
            });
        }
        
        RateLimitEntry phoneEntry = rateLimits.get(phone5MinKey);
        logger.debug("OTP rate limit recorded for phone {}: {}/{} (5min), IP: {}", 
            maskPhone(phone), 
            phoneEntry != null ? phoneEntry.getCount() : 0, 
            OTP_MAX_PER_5_MIN,
            maskIp(ipAddress));
    }

    /**
     * Check and record OTP attempt - throws if not allowed.
     * Use this for OTP-related actions.
     */
    public void checkAndRecordOtp(String phone, String ipAddress) {
        // Check IP blacklist first
        if (isIpBlacklisted(ipAddress)) {
            IpBlacklistEntry entry = ipBlacklist.get(ipAddress);
            long hoursRemaining = Duration.between(LocalDateTime.now(), entry.getExpiresAt()).toHours();
            logger.warn("Blocked OTP request from blacklisted IP: {}", maskIp(ipAddress));
            throw new RuntimeException(
                String.format("Your IP has been temporarily blocked due to suspicious activity. Please try again in %d hours.", hoursRemaining)
            );
        }
        
        if (!isOtpAllowed(phone, ipAddress)) {
            // Determine which limit was hit
            String phone5MinKey = buildKey(phone, "OTP_5MIN");
            RateLimitEntry phone5MinEntry = rateLimits.get(phone5MinKey);
            
            if (phone5MinEntry != null && !phone5MinEntry.isExpired() && phone5MinEntry.getCount() >= OTP_MAX_PER_5_MIN) {
                long secondsRemaining = Duration.between(LocalDateTime.now(), phone5MinEntry.getExpiresAt()).getSeconds();
                int minutesRemaining = (int) Math.ceil(secondsRemaining / 60.0);
                throw new RuntimeException(
                    String.format("Too many OTP requests. Please wait %d minute(s) before requesting another code. You can request up to %d codes every %d minutes.", 
                        minutesRemaining, OTP_MAX_PER_5_MIN, OTP_WINDOW_MINUTES)
                );
            }
            
            throw new RuntimeException("Too many requests. Please try again later.");
        }
        
        recordOtpAttempt(phone, ipAddress);
    }

    /**
     * Legacy method for backward compatibility.
     * Checks general rate limiting or OTP based on action type.
     */
    public void checkAndRecord(String identifier, String action) {
        if (isOtpAction(action)) {
            // For OTP actions, use the new system with null IP (backward compatibility)
            checkAndRecordOtp(identifier, null);
        } else {
            // General rate limiting
            if (!isAllowed(identifier, action)) {
                logger.warn("Rate limit exceeded for {} on action {}", identifier, action);
                throw new RuntimeException(
                    String.format("Too many requests. Please wait %d minute(s) before trying again.", GENERAL_WINDOW_MINUTES)
                );
            }
            recordAttempt(identifier, action);
        }
    }

    /**
     * Check if an action is allowed for the given identifier (general rate limiting)
     */
    public boolean isAllowed(String identifier, String action) {
        String key = buildKey(identifier, action);
        RateLimitEntry entry = rateLimits.get(key);

        if (entry == null || entry.isExpired()) {
            return true;
        }

        int maxRequests = MAX_GENERAL_REQUESTS;
        return entry.getCount() < maxRequests;
    }

    /**
     * Record an action attempt (general rate limiting)
     */
    public void recordAttempt(String identifier, String action) {
        String key = buildKey(identifier, action);
        
        rateLimits.compute(key, (k, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new RateLimitEntry(1, LocalDateTime.now().plusMinutes(GENERAL_WINDOW_MINUTES));
            }
            existing.incrementCount();
            return existing;
        });

        logger.debug("Rate limit recorded for {}: {}", key, rateLimits.get(key).getCount());
    }

    // ==================== IP Blacklist Management ====================

    /**
     * Check if an IP is currently blacklisted.
     */
    public boolean isIpBlacklisted(String ipAddress) {
        if (ipAddress == null || ipAddress.isEmpty()) {
            return false;
        }
        
        IpBlacklistEntry entry = ipBlacklist.get(ipAddress);
        if (entry == null) {
            return false;
        }
        
        if (entry.isExpired()) {
            // Don't remove - keep for repeat offense tracking
            return false;
        }
        
        return true;
    }

    /**
     * Blacklist an IP address.
     * First offense: 2 hours, Repeat offense: 100 hours
     */
    private void blacklistIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isEmpty()) {
            return;
        }
        
        IpBlacklistEntry existing = ipBlacklist.get(ipAddress);
        LocalDateTime now = LocalDateTime.now();
        
        if (existing != null && existing.hasBeenBlacklistedBefore()) {
            // Repeat offense - 100 hours
            ipBlacklist.put(ipAddress, new IpBlacklistEntry(
                now.plusHours(IP_BLACKLIST_HOURS_REPEAT), 
                existing.getOffenseCount() + 1
            ));
            logger.error("IP {} blacklisted for {} hours (repeat offense #{})", 
                maskIp(ipAddress), IP_BLACKLIST_HOURS_REPEAT, existing.getOffenseCount() + 1);
        } else {
            // First offense - 2 hours
            ipBlacklist.put(ipAddress, new IpBlacklistEntry(
                now.plusHours(IP_BLACKLIST_HOURS_FIRST), 
                1
            ));
            logger.warn("IP {} blacklisted for {} hours (first offense)", 
                maskIp(ipAddress), IP_BLACKLIST_HOURS_FIRST);
        }
    }

    // ==================== Utility Methods ====================

    /**
     * Get remaining OTP attempts for a phone number.
     */
    public int getRemainingOtpAttempts(String phone) {
        String phone5MinKey = buildKey(phone, "OTP_5MIN");
        RateLimitEntry entry = rateLimits.get(phone5MinKey);
        
        if (entry == null || entry.isExpired()) {
            return OTP_MAX_PER_5_MIN;
        }
        
        return Math.max(0, OTP_MAX_PER_5_MIN - entry.getCount());
    }

    /**
     * Get remaining attempts (legacy method)
     */
    public int getRemainingAttempts(String identifier, String action) {
        if (isOtpAction(action)) {
            return getRemainingOtpAttempts(identifier);
        }
        
        String key = buildKey(identifier, action);
        RateLimitEntry entry = rateLimits.get(key);
        
        if (entry == null || entry.isExpired()) {
            return MAX_GENERAL_REQUESTS;
        }
        
        return Math.max(0, MAX_GENERAL_REQUESTS - entry.getCount());
    }
    
    /**
     * Get seconds remaining until OTP rate limit resets for a phone.
     */
    public long getSecondsUntilOtpReset(String phone) {
        String phone5MinKey = buildKey(phone, "OTP_5MIN");
        RateLimitEntry entry = rateLimits.get(phone5MinKey);
        
        if (entry == null || entry.isExpired()) {
            return 0;
        }
        
        return Duration.between(LocalDateTime.now(), entry.getExpiresAt()).getSeconds();
    }
    
    /**
     * Get seconds remaining until rate limit resets (legacy method)
     */
    public long getSecondsUntilReset(String identifier, String action) {
        if (isOtpAction(action)) {
            return getSecondsUntilOtpReset(identifier);
        }
        
        String key = buildKey(identifier, action);
        RateLimitEntry entry = rateLimits.get(key);
        
        if (entry == null || entry.isExpired()) {
            return 0;
        }
        
        return Duration.between(LocalDateTime.now(), entry.getExpiresAt()).getSeconds();
    }
    
    /**
     * Check if action is phone-based OTP
     */
    private boolean isPhoneOtpAction(String action) {
        return action != null && action.equals("OTP_SEND");
    }

    /**
     * Check if action is email-based OTP (password reset via email)
     */
    private boolean isEmailOtpAction(String action) {
        return action != null && action.equals("EMAIL_OTP");
    }

    /**
     * Check and record OTP attempt for email - similar to phone but for email identifier.
     */
    public void checkAndRecordEmailOtp(String email, String ipAddress) {
        // Check IP blacklist first
        if (isIpBlacklisted(ipAddress)) {
            IpBlacklistEntry entry = ipBlacklist.get(ipAddress);
            long hoursRemaining = Duration.between(LocalDateTime.now(), entry.getExpiresAt()).toHours();
            logger.warn("Blocked email OTP request from blacklisted IP: {}", maskIp(ipAddress));
            throw new RuntimeException(
                String.format("Your IP has been temporarily blocked due to suspicious activity. Please try again in %d hours.", hoursRemaining)
            );
        }
        
        // Check 5-minute rate for email (3 per 5 minutes)
        String email5MinKey = buildKey(email, "EMAIL_OTP_5MIN");
        RateLimitEntry email5MinEntry = rateLimits.get(email5MinKey);
        if (email5MinEntry != null && !email5MinEntry.isExpired() && email5MinEntry.getCount() >= OTP_MAX_PER_5_MIN) {
            long secondsRemaining = Duration.between(LocalDateTime.now(), email5MinEntry.getExpiresAt()).getSeconds();
            int minutesRemaining = (int) Math.ceil(secondsRemaining / 60.0);
            logger.warn("Email {} exceeded 5-minute OTP limit", maskEmail(email));
            throw new RuntimeException(
                String.format("Too many OTP requests. Please wait %d minute(s) before requesting another code.", minutesRemaining)
            );
        }
        
        // Record the attempt
        LocalDateTime now = LocalDateTime.now();
        rateLimits.compute(email5MinKey, (k, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new RateLimitEntry(1, now.plusMinutes(OTP_WINDOW_MINUTES));
            }
            existing.incrementCount();
            return existing;
        });
        
        RateLimitEntry emailEntry = rateLimits.get(email5MinKey);
        logger.debug("Email OTP rate limit recorded for {}: {}/{} (5min), IP: {}", 
            maskEmail(email), 
            emailEntry != null ? emailEntry.getCount() : 0, 
            OTP_MAX_PER_5_MIN,
            maskIp(ipAddress));
    }

    /**
     * Mask email for logging (shows first 2 chars and domain).
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIndex = email.indexOf("@");
        if (atIndex <= 2) return "***" + email.substring(atIndex);
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    /**
     * Reset rate limit for identifier
     */
    public void reset(String identifier, String action) {
        String key = buildKey(identifier, action);
        rateLimits.remove(key);
        
        if (isOtpAction(action)) {
            // Also reset the minute counter
            rateLimits.remove(buildKey(identifier, "OTP_MINUTE"));
            rateLimits.remove(buildKey(identifier, "OTP_5MIN"));
        }
    }

    /**
     * Manually unblock an IP (admin function)
     */
    public void unblockIp(String ipAddress) {
        ipBlacklist.remove(ipAddress);
        rateLimits.remove(buildKey(ipAddress, "IP_OTP_MINUTE"));
        logger.info("IP {} manually unblocked", maskIp(ipAddress));
    }

    private String buildKey(String identifier, String action) {
        return action + ":" + identifier;
    }
    
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) {
            return "****";
        }
        return phone.substring(0, 4) + "****" + phone.substring(phone.length() - 2);
    }
    
    private String maskIp(String ip) {
        if (ip == null || ip.isEmpty()) {
            return "unknown";
        }
        // For IPv4, show first octet only
        int firstDot = ip.indexOf('.');
        if (firstDot > 0) {
            return ip.substring(0, firstDot) + ".***.***.***";
        }
        return ip.substring(0, Math.min(4, ip.length())) + "***";
    }

    /**
     * Cleanup expired entries (call periodically)
     */
    public void cleanup() {
        rateLimits.entrySet().removeIf(entry -> entry.getValue().isExpired());
        // Keep blacklist entries for repeat offense tracking, but clean up very old ones (> 200 hours)
        ipBlacklist.entrySet().removeIf(entry -> 
            Duration.between(entry.getValue().getExpiresAt(), LocalDateTime.now()).toHours() > 200
        );
    }

    /**
     * Check if the action is a phone-based OTP action (not email-based password reset)
     * This is used to route to the appropriate rate limiting method
     */
    private boolean isOtpAction(String action) {
        // Only OTP_SEND is treated as a phone OTP action
        // PASSWORD_RESET uses email OTP and has its own rate limiting via checkAndRecordEmailOtp
        return "OTP_SEND".equalsIgnoreCase(action);
    }

    // ==================== Inner Classes ====================

    /**
     * Rate limit entry for tracking request counts
     */
    private static class RateLimitEntry {
        private int count;
        private final LocalDateTime expiresAt;

        public RateLimitEntry(int count, LocalDateTime expiresAt) {
            this.count = count;
            this.expiresAt = expiresAt;
        }

        public int getCount() { return count; }
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public void incrementCount() { count++; }
        public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
    }

    /**
     * IP blacklist entry for tracking blocked IPs
     */
    private static class IpBlacklistEntry {
        private final LocalDateTime expiresAt;
        private final int offenseCount;

        public IpBlacklistEntry(LocalDateTime expiresAt, int offenseCount) {
            this.expiresAt = expiresAt;
            this.offenseCount = offenseCount;
        }

        public LocalDateTime getExpiresAt() { return expiresAt; }
        public int getOffenseCount() { return offenseCount; }
        public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
        public boolean hasBeenBlacklistedBefore() { return offenseCount > 0; }
    }
}
