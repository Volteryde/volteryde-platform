package com.volteryde.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Arrays;

/**
 * TOTP (Time-based One-Time Password) Service — RFC 6238 / RFC 4226.
 *
 * Zero external dependencies: implemented entirely with JDK crypto primitives.
 * Generates and verifies 6-digit TOTP codes compatible with Google Authenticator, Authy, etc.
 */
@Service
public class TotpService {

    private static final Logger logger = LoggerFactory.getLogger(TotpService.class);

    private static final String ISSUER = "Volteryde";
    private static final int CODE_DIGITS = 6;
    private static final int TIME_STEP = 30;
    private static final int ALLOWED_WINDOW = 1;

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    // ==================== Secret generation ====================

    public String generateSecret() {
        byte[] bytes = new byte[20];
        new SecureRandom().nextBytes(bytes);
        return base32Encode(bytes);
    }

    public String getOtpAuthUri(String secret, String account) {
        String encodedIssuer = urlEncode(ISSUER);
        String encodedAccount = urlEncode(account);
        return String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
                encodedIssuer, encodedAccount, secret, encodedIssuer, CODE_DIGITS, TIME_STEP);
    }

    // ==================== Verification ====================

    public boolean verify(String secret, String code) {
        if (secret == null || code == null || !code.matches("\\d{6}")) {
            return false;
        }
        try {
            byte[] secretBytes = base32Decode(secret);
            long currentWindow = System.currentTimeMillis() / 1000 / TIME_STEP;
            for (long w = currentWindow - ALLOWED_WINDOW; w <= currentWindow + ALLOWED_WINDOW; w++) {
                String expected = String.format("%0" + CODE_DIGITS + "d", generateHotp(secretBytes, w));
                if (expected.equals(code)) {
                    return true;
                }
            }
        } catch (Exception e) {
            logger.error("TOTP verification error: {}", e.getMessage());
        }
        return false;
    }

    // ==================== HOTP (core algorithm) ====================

    private int generateHotp(byte[] secret, long counter) throws Exception {
        byte[] counterBytes = new byte[8];
        for (int i = 7; i >= 0; i--) {
            counterBytes[i] = (byte) (counter & 0xFF);
            counter >>= 8;
        }
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(secret, "RAW"));
        byte[] hash = mac.doFinal(counterBytes);

        int offset = hash[hash.length - 1] & 0x0F;
        int truncated = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);

        int modulus = (int) Math.pow(10, CODE_DIGITS);
        return truncated % modulus;
    }

    // ==================== Base32 (RFC 4648) ====================

    private static String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                sb.append(BASE32_ALPHABET.charAt((buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            sb.append(BASE32_ALPHABET.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return sb.toString();
    }

    private static byte[] base32Decode(String input) {
        String s = input.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int[] lookup = new int[128];
        Arrays.fill(lookup, -1);
        for (int i = 0; i < BASE32_ALPHABET.length(); i++) {
            lookup[BASE32_ALPHABET.charAt(i)] = i;
        }
        byte[] result = new byte[s.length() * 5 / 8];
        int buffer = 0, bitsLeft = 0, idx = 0;
        for (char c : s.toCharArray()) {
            if (c >= 128 || lookup[c] < 0) continue;
            buffer = (buffer << 5) | lookup[c];
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[idx++] = (byte) (buffer >> (bitsLeft - 8));
                bitsLeft -= 8;
            }
        }
        return result;
    }

    private static String urlEncode(String s) {
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')
                    || c == '-' || c == '_' || c == '.' || c == '~') {
                sb.append(c);
            } else {
                byte[] bytes;
                try {
                    bytes = String.valueOf(c).getBytes(java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    bytes = new byte[]{(byte) c};
                }
                for (byte b : bytes) {
                    sb.append(String.format("%%%02X", b & 0xFF));
                }
            }
        }
        return sb.toString();
    }
}
