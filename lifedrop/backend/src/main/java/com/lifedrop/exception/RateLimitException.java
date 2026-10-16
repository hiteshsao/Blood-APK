package com.lifedrop.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a user exceeds the permitted request rate limit (HTTP 429).
 */
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class RateLimitException extends RuntimeException {

    public RateLimitException(String message) {
        super(message);
    }

    public RateLimitException(String message, Throwable cause) {
        super(message, cause);
    }
}
