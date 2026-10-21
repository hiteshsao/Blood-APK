package com.lifedrop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.SosRequestDto;
import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.Role;
import com.lifedrop.enums.Urgency;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.NotificationRepository;
import com.lifedrop.repository.RequestResponseRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmergencySosIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @Autowired
    private RequestResponseRepository requestResponseRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User recipient;
    private String recipientToken;

    private User donorClose;
    private User donorFar;
    private String donorToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Recipient at Delhi Center (28.6139, 77.2090)
        recipient = userRepository.save(User.builder()
                .name("Anjali Recipient")
                .email("anjali@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543210")
                .role(Role.RECIPIENT)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Delhi")
                .latitude(28.6139)
                .longitude(77.2090)
                .available(false)
                .active(true)
                .build());
        recipientToken = jwtUtil.generateToken(recipient.getEmail(), recipient.getRole(), recipient.getId());

        // 2. Donor ~12 km away (within 25 km)
        donorClose = userRepository.save(User.builder()
                .name("Rohit Donor")
                .email("rohit@example.com")
                .password("$2a$10$hashedPass")
                .phone("9123456789")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Delhi")
                .latitude(28.7041)
                .longitude(77.1025)
                .available(true)
                .active(true)
                .lastDonatedDate(LocalDate.now().minusDays(100))
                .pushToken("ExponentPushToken[rohit_close_donor]")
                .build());
        donorToken = jwtUtil.generateToken(donorClose.getEmail(), donorClose.getRole(), donorClose.getId());

        // 3. Donor ~35 km away (outside 25 km, within 50 km)
        donorFar = userRepository.save(User.builder()
                .name("Vikram Far Donor")
                .email("vikram@example.com")
                .password("$2a$10$hashedPass")
                .phone("9988776655")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Noida")
                .latitude(28.5355)
                .longitude(77.3910)
                .available(true)
                .active(true)
                .lastDonatedDate(LocalDate.now().minusDays(120))
                .pushToken("ExponentPushToken[vikram_far_donor]")
                .build());
    }

    @Test
    @DisplayName("1. POST /api/recipient/sos creates URGENT request with 25 km, requiredBy +6h, and returns {requestId, donorsNotified}")
    void testCreateSosSuccess() throws Exception {
        SosRequestDto sos = SosRequestDto.builder()
                .patientName("Sunita Sharma")
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Delhi")
                .latitude(28.6139)
                .longitude(77.2090)
                .message("Immediate emergency surgery at AIIMS Delhi")
                .build();

        mockMvc.perform(post("/api/recipient/sos")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sos)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.requestId").isNumber())
                .andExpect(jsonPath("$.data.donorsNotified").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.radiusKm").value(25.0));

        BloodRequest created = bloodRequestRepository.findAll().get(0);
        assertEquals(Urgency.URGENT, created.getUrgency());
        assertEquals(RequestStatus.PENDING, created.getStatus());
        assertEquals("Sunita Sharma", created.getPatientName());
        assertTrue(created.getRequiredBy().isAfter(LocalDateTime.now().plusHours(5)));
    }

    @Test
    @DisplayName("2. If no donors found within 25 km, auto-retries once with 50 km radius")
    void testCreateSosAutoRetry50Km() throws Exception {
        // Recipient is at a location where donorFar (35 km) is in range, but donorClose is NOT in 25 km
        // Recipient at (28.4595, 77.0266) Gurgaon:
        // Distance to donorFar (28.5355, 77.3910) is ~36.5 km (>25 km, <50 km)
        // Distance to donorClose (28.7041, 77.1025) is ~28.2 km (>25 km, <50 km)
        SosRequestDto sos = SosRequestDto.builder()
                .patientName("Emergency Patient")
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Gurgaon")
                .latitude(28.4595)
                .longitude(77.0266)
                .message("Critical trauma need")
                .build();

        mockMvc.perform(post("/api/recipient/sos")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sos)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.radiusKm").value(50.0))
                .andExpect(jsonPath("$.data.donorsNotified").value(greaterThanOrEqualTo(1)));

        BloodRequest created = bloodRequestRepository.findAll().get(0);
        assertEquals(50.0, created.getRadiusKm());
    }

    @Test
    @DisplayName("3. Enforces limit: one active SOS per recipient at a time")
    void testOneActiveSosLimit() throws Exception {
        SosRequestDto sos = SosRequestDto.builder()
                .patientName("Patient One")
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Delhi")
                .latitude(28.6139)
                .longitude(77.2090)
                .message("First emergency")
                .build();

        // 1st SOS -> 201 Created
        mockMvc.perform(post("/api/recipient/sos")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sos)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        // 2nd SOS while 1st is still active -> 400 Bad Request
        SosRequestDto secondSos = SosRequestDto.builder()
                .patientName("Patient Two")
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Delhi")
                .latitude(28.6139)
                .longitude(77.2090)
                .message("Second emergency")
                .build();

        mockMvc.perform(post("/api/recipient/sos")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondSos)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("already have an active SOS request")));
    }

    @Test
    @DisplayName("4. GET /api/recipient/sos/active returns the active SOS")
    void testGetActiveSos() throws Exception {
        SosRequestDto sos = SosRequestDto.builder()
                .patientName("Patient Three")
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Delhi")
                .latitude(28.6139)
                .longitude(77.2090)
                .message("Emergency alert")
                .build();

        mockMvc.perform(post("/api/recipient/sos")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sos)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/recipient/sos/active")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.patientName").value("Patient Three"))
                .andExpect(jsonPath("$.data.urgency").value("URGENT"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("5. Non-recipient calling POST /api/recipient/sos receives 403 Forbidden")
    void testDonorForbiddenFromSos() throws Exception {
        SosRequestDto sos = SosRequestDto.builder()
                .patientName("Unauthorized Donor Trying SOS")
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Delhi")
                .latitude(28.6139)
                .longitude(77.2090)
                .build();

        mockMvc.perform(post("/api/recipient/sos")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sos)))
                .andExpect(status().isForbidden());
    }
}
