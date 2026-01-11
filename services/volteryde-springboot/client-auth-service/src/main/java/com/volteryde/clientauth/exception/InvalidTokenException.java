package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for invalid or expired tokens
 */
public class InvalidTokenException extends ClientAuthException {

    public InvalidTokenException() {
        super("Invalid or expired token", HttpStatus.UNAUTHORIZED, "INVALID_TOKEN");
    }

    public InvalidTokenException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN");
    }
}
