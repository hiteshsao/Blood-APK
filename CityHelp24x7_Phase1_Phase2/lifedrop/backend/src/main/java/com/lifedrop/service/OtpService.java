package com.lifedrop.service;

import com.lifedrop.dto.AuthResponse;
import com.lifedrop.dto.UserSummary;
import com.lifedrop.entity.EmailOtp;
import com.lifedrop.entity.User;
import com.lifedrop.exception.InvalidOtpException;
import com.lifedrop.exception.RateLimitException;
import com.lifedrop.repository.EmailOtpRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.security.JwtUtil;
import com.lifedrop.service.mail.OtpMailSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Service managing passwordless Email OTP authentication:
 * - Secure 6-digit generation with SecureRandom
 * - HMAC-SHA256 hashing with server-side pepper
 * - Anti-enumeration: consistent 200 response on send
 * - Strict 401 generic message on verification failure
 * - Per-IP and per-email rate limiting and resend cooldowns
 * - Automatic single-use consumption and scheduled cleanup
 */
@Slf4j
@Service
public class OtpService {

    public static final String SEND_GENERIC_MESSAGE = "If this email is registered, a login code has been sent.";

    private final EmailOtpRepository emailOtpRepository;
    private final UserRepository userRepository;
    private final OtpMailSender otpMailSender;
    private final IpRateLimiter ipRateLimiter;
    private final JwtUtil jwtUtil;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    private final int otpLength;
    private final int expiryMinutes;
    private final int maxAttempts;
    private final int resendCooldownSeconds;
    private final int maxSendsPerHour;
    private final String otpPepper;

    public OtpService(
            EmailOtpRepository emailOtpRepository,
            UserRepository userRepository,
            OtpMailSender otpMailSender,
            IpRateLimiter ipRateLimiter,
            JwtUtil jwtUtil,
            Clock clock,
            @Value("${app.otp.length:6}") int otpLength,
            @Value("${app.otp.expiry-minutes:5}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts,
            @Value("${app.otp.resend-cooldown-seconds:60}") int resendCooldownSeconds,
            @Value("${app.otp.max-sends-per-hour:5}") int maxSendsPerHour,
            @Value("${app.otp.pepper:dev-only-otp-pepper-change-me}") String otpPepper
    ) {
        this.emailOtpRepository = emailOtpRepository;
        this.userRepository = userRepository;
        this.otpMailSender = otpMailSender;
        this.ipRateLimiter = ipRateLimiter;
        this.jwtUtil = jwtUtil;
        this.clock = clock;
        this.otpLength = otpLength;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.maxSendsPerHour = maxSendsPerHour;
        this.otpPepper = otpPepper;
    }

    /**
     * Send OTP to the specified email address if the account exists and is active.
     * Prevents user enumeration by always returning HTTP 200 with the exact same message.
     */
    @Transactional
    public String sendOtp(String email, String clientIp) {
        // Enforce per-IP rate limit (20 req / 10 min)
        ipRateLimiter.checkRateLimit(clientIp);

        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();

        // Check if user exists and is active
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        boolean isEligible = userOpt.isPresent() && Boolean.TRUE.equals(userOpt.get().getActive());

        if (!isEligible) {
            // Anti-enumeration: return identical generic message without sending anything
            return SEND_GENERIC_MESSAGE;
        }

        Instant now = Instant.now(clock);

        // Check resend cooldown on the latest active OTP
        Optional<EmailOtp> latestOtp = emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(normalizedEmail);
        if (latestOtp.isPresent()) {
            Instant cooldownEnd = latestOtp.get().getCreatedAt().plusSeconds(resendCooldownSeconds);
            if (cooldownEnd.isAfter(now)) {
                long secondsLeft = Math.max(1, Duration.between(now, cooldownEnd).toSeconds());
                throw new RateLimitException("Please wait " + secondsLeft + " seconds before requesting another code.");
            }
        }

        // Check per-email hourly cap
        Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);
        long sendsInLastHour = emailOtpRepository.countByEmailAndCreatedAtAfter(normalizedEmail, oneHourAgo);
        if (sendsInLastHour >= maxSendsPerHour) {
            throw new RateLimitException("Too many OTP requests for this email. Please try again later.");
        }

        // Invalidate (consume) all prior unused codes for this email
        emailOtpRepository.invalidateActiveOtpsForEmail(normalizedEmail);

        // Generate 6-digit code
        int maxBound = (int) Math.pow(10, otpLength);
        int codeNumber = secureRandom.nextInt(maxBound);
        String formatString = "%0" + otpLength + "d";
        String plainCode = String.format(formatString, codeNumber);

        // Hash code using HMAC-SHA256 with server pepper
        String otpHash = hashOtp(plainCode, otpPepper);

        EmailOtp emailOtp = EmailOtp.builder()
                .email(normalizedEmail)
                .otpHash(otpHash)
                .createdAt(now)
                .expiresAt(now.plus(expiryMinutes, ChronoUnit.MINUTES))
                .attempts(0)
                .consumed(false)
                .build();

        emailOtpRepository.save(emailOtp);

        // Dispatch email (safe against exceptions)
        try {
            otpMailSender.sendOtpEmail(normalizedEmail, plainCode);
        } catch (Exception e) {
            log.error("Failed to deliver OTP to {}: {}", normalizedEmail, e.getMessage());
        }

        return SEND_GENERIC_MESSAGE;
    }

    /**
     * Verify OTP code and return full AuthResponse (token + UserSummary).
     * Any failure throws InvalidOtpException which maps to HTTP 401 "Invalid or expired code".
     */
    @Transactional
    public AuthResponse verifyOtp(String email, String plainOtp, String clientIp) {
        // Enforce per-IP rate limit
        ipRateLimiter.checkRateLimit(clientIp);

        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();

        // Validate user account
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(InvalidOtpException::new);

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new InvalidOtpException();
        }

        // Retrieve latest unconsumed OTP
        EmailOtp otpEntity = emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(InvalidOtpException::new);

        Instant now = Instant.now(clock);

        // Check expiration
        if (otpEntity.getExpiresAt().isBefore(now)) {
            otpEntity.setConsumed(true);
            emailOtpRepository.save(otpEntity);
            throw new InvalidOtpException();
        }

        // Check maximum attempts
        if (otpEntity.getAttempts() >= maxAttempts) {
            otpEntity.setConsumed(true);
            emailOtpRepository.save(otpEntity);
            throw new InvalidOtpException();
        }

        // Constant-time HMAC comparison
        String candidateHash = hashOtp(plainOtp.trim(), otpPepper);
        boolean matches = MessageDigest.isEqual(
                otpEntity.getOtpHash().getBytes(StandardCharsets.UTF_8),
                candidateHash.getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            int newAttempts = otpEntity.getAttempts() + 1;
            otpEntity.setAttempts(newAttempts);
            if (newAttempts >= maxAttempts) {
                otpEntity.setConsumed(true);
            }
            emailOtpRepository.save(otpEntity);
            throw new InvalidOtpException();
        }

        // Code matched: mark consumed
        otpEntity.setConsumed(true);
        emailOtpRepository.save(otpEntity);

        // Generate JWT token matching AuthService.login()
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .user(UserSummary.fromUser(user))
                .build();
    }

    /**
     * Daily scheduled job to purge OTP rows older than 24 hours.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldOtps() {
        Instant cutoff = Instant.now(clock).minus(24, ChronoUnit.HOURS);
        int purged = emailOtpRepository.deleteByCreatedAtBefore(cutoff);
        log.info("🧹 Purged {} expired/consumed OTP records older than 24 hours", purged);
    }

    /**
     * Compute HMAC-SHA256 of plain OTP code with server secret pepper.
     */
    public String hashOtp(String code, String pepper) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(pepper.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hmac = mac.doFinal(code.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hmac);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA256", e);
        }
    }
}
