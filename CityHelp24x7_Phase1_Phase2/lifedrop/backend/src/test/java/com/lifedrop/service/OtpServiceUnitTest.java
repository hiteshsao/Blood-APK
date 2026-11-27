package com.lifedrop.service;

import com.lifedrop.dto.AuthResponse;
import com.lifedrop.entity.EmailOtp;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.exception.InvalidOtpException;
import com.lifedrop.exception.RateLimitException;
import com.lifedrop.repository.EmailOtpRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.security.JwtUtil;
import com.lifedrop.service.mail.OtpMailSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceUnitTest {

    @Mock
    private EmailOtpRepository emailOtpRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OtpMailSender otpMailSender;

    @Mock
    private JwtUtil jwtUtil;

    private MutableClock clock;
    private IpRateLimiter ipRateLimiter;
    private OtpService otpService;

    private static final String TEST_EMAIL = "donor1@lifedrop.test";
    private static final String TEST_PEPPER = "test-secret-pepper-1234567890";
    private static final String CLIENT_IP = "192.168.1.100";

    private User activeUser;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-10-21T10:00:00Z"), ZoneOffset.UTC);
        ipRateLimiter = new IpRateLimiter(clock);

        otpService = new OtpService(
                emailOtpRepository,
                userRepository,
                otpMailSender,
                ipRateLimiter,
                jwtUtil,
                clock,
                6,   // otpLength
                5,   // expiryMinutes
                5,   // maxAttempts
                60,  // resendCooldownSeconds
                5,   // maxSendsPerHour
                TEST_PEPPER
        );

        activeUser = User.builder()
                .id(101L)
                .name("Aarav Sharma")
                .email(TEST_EMAIL)
                .role(Role.DONOR)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("1. Success path: send OTP -> verify with correct code -> returns AuthResponse and consumes code")
    void testSendAndVerifySuccess() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));
        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.empty());

        ArgumentCaptor<EmailOtp> otpEntityCaptor = ArgumentCaptor.forClass(EmailOtp.class);
        ArgumentCaptor<String> plainCodeCaptor = ArgumentCaptor.forClass(String.class);

        // Send OTP
        String sendMsg = otpService.sendOtp(TEST_EMAIL, CLIENT_IP);
        assertEquals(OtpService.SEND_GENERIC_MESSAGE, sendMsg);

        verify(otpMailSender).sendOtpEmail(eq(TEST_EMAIL), plainCodeCaptor.capture());
        verify(emailOtpRepository).save(otpEntityCaptor.capture());

        String sentPlainCode = plainCodeCaptor.getValue();
        EmailOtp savedEntity = otpEntityCaptor.getValue();

        assertNotNull(sentPlainCode);
        assertEquals(6, sentPlainCode.length());
        assertNotEquals(sentPlainCode, savedEntity.getOtpHash(), "Stored hash MUST NOT equal plain code");
        assertEquals(64, savedEntity.getOtpHash().length(), "HMAC-SHA256 hex must be 64 characters");

        // Prepare for verify
        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.of(savedEntity));
        when(jwtUtil.generateToken(TEST_EMAIL, Role.DONOR, 101L)).thenReturn("mocked.jwt.token");

        AuthResponse authResponse = otpService.verifyOtp(TEST_EMAIL, sentPlainCode, CLIENT_IP);

        assertNotNull(authResponse);
        assertEquals("mocked.jwt.token", authResponse.getToken());
        assertEquals(TEST_EMAIL, authResponse.getUser().getEmail());
        assertTrue(savedEntity.isConsumed(), "Code must be marked consumed after successful verify");
    }

    @Test
    @DisplayName("2. Wrong code increments attempts and does not consume until threshold")
    void testWrongCodeIncrementsAttempts() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));

        String correctCode = "123456";
        String hash = otpService.hashOtp(correctCode, TEST_PEPPER);

        EmailOtp entity = EmailOtp.builder()
                .id(1L)
                .email(TEST_EMAIL)
                .otpHash(hash)
                .attempts(0)
                .consumed(false)
                .createdAt(clock.instant())
                .expiresAt(clock.instant().plusSeconds(300))
                .build();

        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.of(entity));

        InvalidOtpException ex = assertThrows(InvalidOtpException.class, () ->
                otpService.verifyOtp(TEST_EMAIL, "999999", CLIENT_IP)
        );
        assertEquals("Invalid or expired code", ex.getMessage());
        assertEquals(1, entity.getAttempts(), "Attempts must be incremented to 1");
        assertFalse(entity.isConsumed(), "Should not be consumed after only 1 failed attempt");
        verify(emailOtpRepository).save(entity);
    }

    @Test
    @DisplayName("3. 5 wrong codes lock the code (consumed=true)")
    void testFiveWrongCodesLocksCode() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));

        String correctCode = "123456";
        String hash = otpService.hashOtp(correctCode, TEST_PEPPER);

        EmailOtp entity = EmailOtp.builder()
                .id(1L)
                .email(TEST_EMAIL)
                .otpHash(hash)
                .attempts(4) // 4 prior failures
                .consumed(false)
                .createdAt(clock.instant())
                .expiresAt(clock.instant().plusSeconds(300))
                .build();

        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.of(entity));

        // 5th wrong attempt
        assertThrows(InvalidOtpException.class, () ->
                otpService.verifyOtp(TEST_EMAIL, "000000", CLIENT_IP)
        );

        assertEquals(5, entity.getAttempts());
        assertTrue(entity.isConsumed(), "Code must be locked (consumed=true) after 5 wrong attempts");
    }

    @Test
    @DisplayName("4. Expired code is rejected and marked consumed")
    void testExpiredCodeFails() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));

        String correctCode = "123456";
        String hash = otpService.hashOtp(correctCode, TEST_PEPPER);

        EmailOtp entity = EmailOtp.builder()
                .id(1L)
                .email(TEST_EMAIL)
                .otpHash(hash)
                .attempts(0)
                .consumed(false)
                .createdAt(clock.instant())
                .expiresAt(clock.instant().plusSeconds(300)) // 5 minutes
                .build();

        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.of(entity));

        // Advance time past expiry (6 minutes = 360s)
        clock.advance(Duration.ofSeconds(360));

        assertThrows(InvalidOtpException.class, () ->
                otpService.verifyOtp(TEST_EMAIL, correctCode, CLIENT_IP)
        );
        assertTrue(entity.isConsumed(), "Expired OTP must be marked consumed");
    }

    @Test
    @DisplayName("5. Consumed code cannot be reused")
    void testConsumedCodeCannotBeReused() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));
        // Repository returns empty because findFirstByEmailAndConsumedFalse only finds unconsumed
        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.empty());

        assertThrows(InvalidOtpException.class, () ->
                otpService.verifyOtp(TEST_EMAIL, "123456", CLIENT_IP)
        );
    }

    @Test
    @DisplayName("6. New send invalidates (consumes) earlier unused codes for that email")
    void testNewSendInvalidatesOldCode() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));
        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.empty());

        otpService.sendOtp(TEST_EMAIL, CLIENT_IP);

        verify(emailOtpRepository).invalidateActiveOtpsForEmail(TEST_EMAIL);
    }

    @Test
    @DisplayName("7. 60 second resend cooldown returns 429 RateLimitException")
    void testResendCooldownThrows429() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));

        EmailOtp recentOtp = EmailOtp.builder()
                .createdAt(clock.instant()) // just created now
                .consumed(false)
                .build();

        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.of(recentOtp));

        // Advance time by only 30 seconds (< 60s cooldown)
        clock.advance(Duration.ofSeconds(30));

        RateLimitException ex = assertThrows(RateLimitException.class, () ->
                otpService.sendOtp(TEST_EMAIL, CLIENT_IP)
        );
        assertTrue(ex.getMessage().contains("Please wait"));
        assertTrue(ex.getMessage().contains("seconds"));
        verifyNoInteractions(otpMailSender);
    }

    @Test
    @DisplayName("8. 6th send within an hour returns 429 RateLimitException")
    void testSixthSendWithinAnHourThrows429() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(activeUser));
        // No active OTP triggering cooldown
        when(emailOtpRepository.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(TEST_EMAIL))
                .thenReturn(Optional.empty());
        // Already 5 sends in last hour
        when(emailOtpRepository.countByEmailAndCreatedAtAfter(eq(TEST_EMAIL), any(Instant.class)))
                .thenReturn(5L);

        RateLimitException ex = assertThrows(RateLimitException.class, () ->
                otpService.sendOtp(TEST_EMAIL, CLIENT_IP)
        );
        assertTrue(ex.getMessage().contains("Too many OTP requests for this email"));
        verifyNoInteractions(otpMailSender);
    }

    @Test
    @DisplayName("9. Unknown email returns identical generic 200 response and sends no email")
    void testUnknownEmailReturnsGeneric200AndNoMailSent() {
        when(userRepository.findByEmail("unknown@lifedrop.test")).thenReturn(Optional.empty());

        String result = otpService.sendOtp("unknown@lifedrop.test", CLIENT_IP);

        assertEquals(OtpService.SEND_GENERIC_MESSAGE, result);
        verifyNoInteractions(otpMailSender);
        verify(emailOtpRepository, never()).save(any());
    }

    @Test
    @DisplayName("10. Inactive user returns generic 200 on send (no mail) and generic 401 on verify")
    void testInactiveUserReturnsGeneric200AndGeneric401OnVerify() {
        User inactiveUser = User.builder()
                .id(202L)
                .email("inactive@lifedrop.test")
                .active(false) // Deactivated
                .build();

        when(userRepository.findByEmail("inactive@lifedrop.test")).thenReturn(Optional.of(inactiveUser));

        // Send OTP: returns generic 200, sends nothing
        String sendResult = otpService.sendOtp("inactive@lifedrop.test", CLIENT_IP);
        assertEquals(OtpService.SEND_GENERIC_MESSAGE, sendResult);
        verifyNoInteractions(otpMailSender);

        // Verify OTP: throws 401 InvalidOtpException
        InvalidOtpException ex = assertThrows(InvalidOtpException.class, () ->
                otpService.verifyOtp("inactive@lifedrop.test", "123456", CLIENT_IP)
        );
        assertEquals("Invalid or expired code", ex.getMessage());
    }

    @Test
    @DisplayName("11. In-memory IP rate limiter blocks after 20 requests in 10 minutes")
    void testIpRateLimiterBlocksAfter20Requests() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        String targetIp = "203.0.113.42";
        // 20 requests succeed (with generic response for unknown emails)
        for (int i = 0; i < 20; i++) {
            otpService.sendOtp("test" + i + "@lifedrop.test", targetIp);
        }

        // 21st request from same IP within 10 minutes must throw 429
        RateLimitException ex = assertThrows(RateLimitException.class, () ->
                otpService.sendOtp("test21@lifedrop.test", targetIp)
        );
        assertTrue(ex.getMessage().contains("Too many requests from this IP address"));
    }

    /**
     * Helper mutable clock for time travel testing.
     */
    static class MutableClock extends Clock {
        private Instant instant;
        private final ZoneId zone;

        public MutableClock(Instant initial, ZoneId zone) {
            this.instant = initial;
            this.zone = zone;
        }

        public void advance(Duration duration) {
            this.instant = this.instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
