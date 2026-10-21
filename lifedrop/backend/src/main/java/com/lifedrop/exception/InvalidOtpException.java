package com.lifedrop.exception;

import org.springframework.security.core.AuthenticationException;

/**
 * Thrown whenever OTP verification fails (wrong code, expired, consumed, unknown email, inactive account).
 * Always returns HTTP 401 with the generic message "Invalid or expired code".
 */
public class InvalidOtpException extends AuthenticationException {

    public static final String GENERIC_MESSAGE = "Invalid or expired code";

    public InvalidOtpException() {
        super(GENERIC_MESSAGE);
    }

    public InvalidOtpException(String message) {
        super(message);
    }
}
