package com.lifedrop.service;

import com.lifedrop.exception.RateLimitException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding window rate limiter per client IP address.
 * Limits OTP requests to 20 requests per 10 minutes per IP.
 */
@Component
public class IpRateLimiter {

    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_SECONDS = 600; // 10 minutes

    private final Clock clock;
    private final Map<String, Deque<Instant>> ipWindows = new ConcurrentHashMap<>();

    public IpRateLimiter(Clock clock) {
        this.clock = clock;
    }

    /**
     * Checks if the given IP address has exceeded the request threshold.
     *
     * @param clientIp client IP address string
     * @throws RateLimitException if IP exceeds 20 requests per 10 minutes
     */
    public void checkRateLimit(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return;
        }

        Instant now = Instant.now(clock);
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        ipWindows.compute(clientIp, (ip, deque) -> {
            if (deque == null) {
                deque = new ArrayDeque<>();
            }

            // Remove expired timestamps outside the 10-minute sliding window
            while (!deque.isEmpty() && deque.peekFirst().isBefore(cutoff)) {
                deque.pollFirst();
            }

            if (deque.size() >= MAX_REQUESTS) {
                throw new RateLimitException("Too many requests from this IP address. Please try again later.");
            }

            deque.addLast(now);
            return deque;
        });
    }

    /**
     * Clear all recorded IP windows (useful for testing).
     */
    public void reset() {
        ipWindows.clear();
    }
}
