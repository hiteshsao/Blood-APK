package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.dto.OtpSendRequest;
import com.lifedrop.dto.OtpVerifyRequest;
import com.lifedrop.entity.EmailOtp;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.EmailOtpRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.service.mail.OtpMailSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OtpAuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private OtpMailSender otpMailSender;

    private static final String DONOR_EMAIL = "donor1@lifedrop.test";
    private static final String RAW_PASSWORD = "Password@123";

    @BeforeEach
    void setUp() {
        emailOtpRepository.deleteAll();
        userRepository.deleteAll();

        // Seed donor1@lifedrop.test
        User donor = User.builder()
                .name("Aarav Sharma")
                .email(DONOR_EMAIL)
                .password(passwordEncoder.encode(RAW_PASSWORD))
                .phone("9800000001")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(26)
                .gender("MALE")
                .city("Indore")
                .latitude(22.7244)
                .longitude(75.8839)
                .available(true)
                .active(true)
                .build();
        userRepository.save(donor);
    }

    @Test
    @DisplayName("End-to-end OTP flow: send -> capture code -> verify -> token accesses /me -> reuse fails with 401")
    void testCompleteOtpFlow() throws Exception {
        // 1. POST /api/auth/otp/send
        OtpSendRequest sendReq = OtpSendRequest.builder()
                .email(DONOR_EMAIL)
                .build();

        mockMvc.perform(post("/api/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("If this email is registered, a login code has been sent."));

        // 2. Capture plain code from mocked OtpMailSender
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(otpMailSender).sendOtpEmail(eq(DONOR_EMAIL), codeCaptor.capture());
        String code = codeCaptor.getValue();

        assertNotNull(code);
        assertEquals(6, code.length());
        assertTrue(code.matches("\\d{6}"), "Code must be 6 digits");

        // Verify stored hash in DB is NOT equal to plain code
        List<EmailOtp> otps = emailOtpRepository.findAll();
        assertFalse(otps.isEmpty());
        EmailOtp dbOtp = otps.get(0);
        assertNotEquals(code, dbOtp.getOtpHash(), "Database must store HMAC hash, not plain code");
        assertEquals(64, dbOtp.getOtpHash().length(), "HMAC-SHA256 hex string must be 64 characters");

        // 3. POST /api/auth/otp/verify with correct code
        OtpVerifyRequest verifyReq = OtpVerifyRequest.builder()
                .email(DONOR_EMAIL)
                .otp(code)
                .build();

        MvcResult verifyResult = mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value(DONOR_EMAIL))
                .andExpect(jsonPath("$.data.user.role").value("DONOR"))
                .andReturn();

        JsonNode json = objectMapper.readTree(verifyResult.getResponse().getContentAsString());
        String jwtToken = json.path("data").path("token").asText();
        assertNotNull(jwtToken);
        assertFalse(jwtToken.isBlank());

        // 4. GET /api/auth/me with Bearer token
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(DONOR_EMAIL))
                .andExpect(jsonPath("$.data.name").value("Aarav Sharma"))
                .andExpect(jsonPath("$.data.role").value("DONOR"));

        // 5. Reuse of same OTP must fail with 401 "Invalid or expired code"
        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid or expired code"));
    }

    @Test
    @DisplayName("Existing email + password login continues to work without disruption")
    void testExistingPasswordLoginStillWorks() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email(DONOR_EMAIL)
                .password(RAW_PASSWORD)
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value(DONOR_EMAIL));
    }
}
