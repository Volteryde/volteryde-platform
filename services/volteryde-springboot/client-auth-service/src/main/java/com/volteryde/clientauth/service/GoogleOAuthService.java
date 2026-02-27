package com.volteryde.clientauth.service;

import com.volteryde.clientauth.exception.InvalidCredentialsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Google OAuth Validation Service
 * 
 * Austin: Validates Google ID tokens with Google's tokeninfo endpoint
 * to ensure the token is legitimate and matches one of our expected client IDs.
 * Supports Web, iOS, and Android client IDs.
 * This is critical for security - never trust client-provided Google data
 * without server-side validation.
 */
@Service
public class GoogleOAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);
    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final RestTemplate restTemplate;
    private final Set<String> validClientIds = new HashSet<>();

    @Value("${google.web-client-id:}")
    private String webClientId;

    @Value("${google.ios-client-id:}")
    private String iosClientId;

    @Value("${google.android-client-id:}")
    private String androidClientId;

    public GoogleOAuthService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Austin: Initialize valid client IDs after properties are injected
     */
    @jakarta.annotation.PostConstruct
    private void init() {
        if (webClientId != null && !webClientId.isEmpty()) {
            validClientIds.add(webClientId);
        }
        if (iosClientId != null && !iosClientId.isEmpty()) {
            validClientIds.add(iosClientId);
        }
        if (androidClientId != null && !androidClientId.isEmpty()) {
            validClientIds.add(androidClientId);
        }
        logger.info("Google OAuth configured with {} valid client IDs", validClientIds.size());
    }

    /**
     * Validate Google ID token and extract user information
     * 
     * @param idToken The Google ID token from the client
     * @return GoogleUserInfo containing validated user data
     * @throws InvalidCredentialsException if token is invalid
     */
    public GoogleUserInfo validateIdToken(String idToken) {
        if (idToken == null || idToken.isEmpty()) {
            throw new InvalidCredentialsException("Google ID token is required");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> tokenInfo = restTemplate.getForObject(
                    GOOGLE_TOKEN_INFO_URL + idToken,
                    Map.class);

            if (tokenInfo == null || tokenInfo.containsKey("error")) {
                logger.warn("Invalid Google token: {}", tokenInfo);
                throw new InvalidCredentialsException("Invalid Google ID token");
            }

            // Austin: Verify audience matches one of our valid client IDs (Web, iOS, or
            // Android)
            if (!validClientIds.isEmpty()) {
                String aud = (String) tokenInfo.get("aud");
                if (!validClientIds.contains(aud)) {
                    logger.warn("Token audience mismatch. Expected one of: {}, Got: {}", validClientIds, aud);
                    throw new InvalidCredentialsException("Invalid Google ID token");
                }
            }

            // Extract and return user info
            GoogleUserInfo userInfo = new GoogleUserInfo();
            userInfo.setGoogleId((String) tokenInfo.get("sub"));
            userInfo.setEmail((String) tokenInfo.get("email"));
            userInfo.setEmailVerified("true".equals(String.valueOf(tokenInfo.get("email_verified"))));
            userInfo.setFirstName((String) tokenInfo.get("given_name"));
            userInfo.setLastName((String) tokenInfo.get("family_name"));
            userInfo.setFullName((String) tokenInfo.get("name"));
            userInfo.setPictureUrl((String) tokenInfo.get("picture"));

            logger.info("Google token validated successfully for: {}", userInfo.getEmail());
            return userInfo;

        } catch (Exception e) {
            if (e instanceof InvalidCredentialsException) {
                throw e;
            }
            logger.error("Failed to validate Google token: {}", e.getMessage());
            throw new InvalidCredentialsException("Failed to validate Google token");
        }
    }

    /**
     * Container for validated Google user information
     */
    public static class GoogleUserInfo {
        private String googleId;
        private String email;
        private boolean emailVerified;
        private String firstName;
        private String lastName;
        private String fullName;
        private String pictureUrl;

        public String getGoogleId() {
            return googleId;
        }

        public void setGoogleId(String googleId) {
            this.googleId = googleId;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public boolean isEmailVerified() {
            return emailVerified;
        }

        public void setEmailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getPictureUrl() {
            return pictureUrl;
        }

        public void setPictureUrl(String pictureUrl) {
            this.pictureUrl = pictureUrl;
        }
    }
}
