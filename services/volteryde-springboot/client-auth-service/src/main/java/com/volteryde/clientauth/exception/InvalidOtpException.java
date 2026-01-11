package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for invalid or expired OTP
 */
public class InvalidOtpException extends ClientAuthException {

    public InvalidOtpException() {
        super("Invalid or expired OTP", HttpStatus.BAD_REQUEST, "INVALID_OTP");
    }

    public InvalidOtpException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "INVALID_OTP");
    }
}
