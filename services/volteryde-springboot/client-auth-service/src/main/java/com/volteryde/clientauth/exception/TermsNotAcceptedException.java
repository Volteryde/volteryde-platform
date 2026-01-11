package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for when terms and conditions have not been accepted
 * 
 * Austin: Authentication cannot complete without terms acceptance.
 * This exception should block final auth token generation.
 */
public class TermsNotAcceptedException extends ClientAuthException {

    public TermsNotAcceptedException() {
        super("Terms and conditions must be accepted to continue", HttpStatus.FORBIDDEN, "TERMS_NOT_ACCEPTED");
    }

    public TermsNotAcceptedException(String message) {
        super(message, HttpStatus.FORBIDDEN, "TERMS_NOT_ACCEPTED");
    }
}
