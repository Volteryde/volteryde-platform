package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for invalid credentials (email/password)
 */
public class InvalidCredentialsException extends ClientAuthException {

    public InvalidCredentialsException() {
        super("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    public InvalidCredentialsException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }
}
