package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for rate limit exceeded scenarios
 */
public class RateLimitExceededException extends ClientAuthException {

    public RateLimitExceededException() {
        super("Too many requests. Please try again later.", HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED");
    }

    public RateLimitExceededException(String message) {
        super(message, HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED");
    }
}
