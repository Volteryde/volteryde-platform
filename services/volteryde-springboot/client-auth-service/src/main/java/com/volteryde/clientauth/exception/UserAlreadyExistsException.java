package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for duplicate registration attempts
 */
public class UserAlreadyExistsException extends ClientAuthException {

    public UserAlreadyExistsException() {
        super("User already exists", HttpStatus.CONFLICT, "USER_ALREADY_EXISTS");
    }

    public UserAlreadyExistsException(String message) {
        super(message, HttpStatus.CONFLICT, "USER_ALREADY_EXISTS");
    }
}
