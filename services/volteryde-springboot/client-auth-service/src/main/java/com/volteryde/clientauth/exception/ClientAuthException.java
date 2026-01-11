package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Base exception for client authentication errors
 * 
 * Austin: All auth-related exceptions should extend this class
 * to ensure consistent error handling across the service.
 */
public class ClientAuthException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public ClientAuthException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = "AUTH_ERROR";
    }

    public ClientAuthException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = "AUTH_ERROR";
    }

    public ClientAuthException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() { return status; }
    public String getErrorCode() { return errorCode; }
}
