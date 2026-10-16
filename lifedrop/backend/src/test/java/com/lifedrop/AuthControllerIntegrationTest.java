package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.dto.RegisterRequest;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.lifedrop.repository.BloodRequestRepository bloodRequestRepository;

    @Autowired
    private com.lifedrop.repository.RequestResponseRepository requestResponseRepository;

    @Autowired
    private com.lifedrop.repository.ReportRepository reportRepository;

    @Autowired
    private com.lifedrop.repository.NotificationRepository notificationRepository;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Register Donor successfully returns 201 with JWT and UserSummary")
    void testRegisterDonorSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Arun Kumar")
                .email("arun.donor@example.com")
                .password("StrongPass123")
                .phone("9876543210")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .age(28)
                .gender("Male")
                .city("Bangalore")
                .latitude(12.9716)
                .longitude(77.5946)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.name").value("Arun Kumar"))
                .andExpect(jsonPath("$.data.user.email").value("arun.donor@example.com"))
                .andExpect(jsonPath("$.data.user.role").value("DONOR"))
                .andExpect(jsonPath("$.data.user.bloodGroup").value("O+"))
                .andExpect(jsonPath("$.data.user.city").value("Bangalore"))
                .andExpect(jsonPath("$.data.user.available").value(true));
    }

    @Test
    @DisplayName("2. Register Donor fails if blood group is missing")
    void testRegisterDonorMissingBloodGroupFails() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("No BloodGroup Donor")
                .email("nobg@example.com")
                .password("StrongPass123")
                .phone("9876543210")
                .role(Role.DONOR)
                .bloodGroup(null)
                .age(25)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Blood group is required for donors"));
    }

    @Test
    @DisplayName("3. Register Donor fails if age is under 18 or over 65")
    void testRegisterDonorInvalidAgeFails() throws Exception {
        RegisterRequest youngDonor = RegisterRequest.builder()
                .name("Underage Donor")
                .email("underage@example.com")
                .password("StrongPass123")
                .phone("9876543210")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(16)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(youngDonor)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Donor must be between 18 and 65 years old"));
    }

    @Test
    @DisplayName("4. Register Recipient successfully without requiring bloodGroup")
    void testRegisterRecipientSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Priya Recipient")
                .email("priya@example.com")
                .password("Password123")
                .phone("9123456789")
                .role(Role.RECIPIENT)
                .city("Chennai")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.role").value("RECIPIENT"))
                .andExpect(jsonPath("$.data.user.email").value("priya@example.com"));
    }

    @Test
    @DisplayName("5. Duplicate email registration returns 400 error")
    void testDuplicateEmailRegistrationFails() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("User One")
                .email("duplicate@example.com")
                .password("Password123")
                .phone("9876543210")
                .role(Role.RECIPIENT)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("6. Login with correct credentials returns 200 and token; wrong password returns clean 401")
    void testLoginScenarios() throws Exception {
        // Register user
        RegisterRequest register = RegisterRequest.builder()
                .name("Vikram")
                .email("vikram@example.com")
                .password("SecretPassword123")
                .phone("9876543210")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .age(30)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        // Correct password
        LoginRequest validLogin = LoginRequest.builder()
                .email("vikram@example.com")
                .password("SecretPassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.email").value("vikram@example.com"));

        // Wrong password -> 401
        LoginRequest wrongPassLogin = LoginRequest.builder()
                .email("vikram@example.com")
                .password("WrongPassword999")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPassLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("7. /api/auth/me requires valid token; returns 401 if missing")
    void testGetCurrentUserEndpoint() throws Exception {
        // Without token -> 401
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        // Register and get token
        RegisterRequest register = RegisterRequest.builder()
                .name("Me User")
                .email("me@example.com")
                .password("Password123")
                .phone("9876543210")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.AB_POSITIVE)
                .age(22)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = json.get("data").get("token").asText();

        // With valid token -> 200
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("me@example.com"))
                .andExpect(jsonPath("$.data.name").value("Me User"))
                .andExpect(jsonPath("$.data.role").value("DONOR"));
    }

    @Test
    @DisplayName("8. Role-based security: Donor can access /api/donor/**, Recipient gets 403; Recipient can access /api/recipient/**, Donor gets 403")
    void testRoleBasedAccessControl() throws Exception {
        // Register Donor
        RegisterRequest donorReq = RegisterRequest.builder()
                .name("Donor Dave")
                .email("dave.donor@example.com")
                .password("Password123")
                .phone("9876543210")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .age(35)
                .build();

        MvcResult donorRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donorReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String donorToken = objectMapper.readTree(donorRes.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Register Recipient
        RegisterRequest recipientReq = RegisterRequest.builder()
                .name("Recipient Rita")
                .email("rita.recipient@example.com")
                .password("Password123")
                .phone("9123456789")
                .role(Role.RECIPIENT)
                .build();

        MvcResult recipientRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recipientReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String recipientToken = objectMapper.readTree(recipientRes.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Donor accessing /api/donor/test -> 200 OK
        mockMvc.perform(get("/api/donor/test")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("DONOR"));

        // Donor accessing /api/recipient/test -> 403 FORBIDDEN
        mockMvc.perform(get("/api/recipient/test")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Access Denied: You do not have permission to access this resource"));

        // Recipient accessing /api/recipient/test -> 200 OK
        mockMvc.perform(get("/api/recipient/test")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("RECIPIENT"));

        // Recipient accessing /api/donor/test -> 403 FORBIDDEN
        mockMvc.perform(get("/api/donor/test")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Access Denied: You do not have permission to access this resource"));

        // Unauthenticated access -> 401 UNAUTHORIZED
        mockMvc.perform(get("/api/donor/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
