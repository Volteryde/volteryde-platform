package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for user not found scenarios
 */
public class UserNotFoundException extends ClientAuthException {

    public UserNotFoundException() {
        super("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }

    public UserNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }
}
