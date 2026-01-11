package com.volteryde.clientauth.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for account not in active status
 */
public class AccountNotActiveException extends ClientAuthException {

    public AccountNotActiveException() {
        super("Account is not active", HttpStatus.FORBIDDEN, "ACCOUNT_NOT_ACTIVE");
    }

    public AccountNotActiveException(String message) {
        super(message, HttpStatus.FORBIDDEN, "ACCOUNT_NOT_ACTIVE");
    }
}
