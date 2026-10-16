package com.lifedrop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.CreateBloodRequestDto;
import com.lifedrop.dto.ReportRequestDto;
import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.Role;
import com.lifedrop.enums.Urgency;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.NotificationRepository;
import com.lifedrop.repository.ReportRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SafetyAndRateLimitIntegrationTest {

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
    private ReportRepository reportRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User recipient;
    private User donor1;
    private User donor2;
    private User donor3;

    private String recipientToken;
    private String donor1Token;
    private String donor2Token;
    private String donor3Token;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();

        recipient = userRepository.save(User.builder()
                .name("Ramesh Recipient")
                .email("ramesh.recipient@example.com")
                .password("$2a$10$hashedPass")
                .phone("9811122233")
                .role(Role.RECIPIENT)
                .city("Delhi")
                .latitude(28.6315)
                .longitude(77.2167)
                .available(false)
                .active(true)
                .build());
        recipientToken = jwtUtil.generateToken(recipient.getEmail(), recipient.getRole(), recipient.getId());

        donor1 = userRepository.save(User.builder()
                .name("Donor One")
                .email("donor1@example.com")
                .password("$2a$10$hashedPass")
                .phone("9800000001")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .city("Delhi")
                .latitude(28.6400)
                .longitude(77.2200)
                .available(true)
                .active(true)
                .build());
        donor1Token = jwtUtil.generateToken(donor1.getEmail(), donor1.getRole(), donor1.getId());

        donor2 = userRepository.save(User.builder()
                .name("Donor Two")
                .email("donor2@example.com")
                .password("$2a$10$hashedPass")
                .phone("9800000002")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .city("Delhi")
                .latitude(28.6200)
                .longitude(77.2100)
                .available(true)
                .active(true)
                .build());
        donor2Token = jwtUtil.generateToken(donor2.getEmail(), donor2.getRole(), donor2.getId());

        donor3 = userRepository.save(User.builder()
                .name("Donor Three")
                .email("donor3@example.com")
                .password("$2a$10$hashedPass")
                .phone("9800000003")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .city("Delhi")
                .latitude(28.6500)
                .longitude(77.2300)
                .available(true)
                .active(true)
                .build());
        donor3Token = jwtUtil.generateToken(donor3.getEmail(), donor3.getRole(), donor3.getId());
    }

    @Test
    @DisplayName("1. Rate Limit: Recipient can create at most 3 requests per 24 hours; 4th returns 429")
    void testRecipientRateLimitEnforced() throws Exception {
        CreateBloodRequestDto dto = CreateBloodRequestDto.builder()
                .patientName("Patient")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .latitude(28.6315)
                .longitude(77.2167)
                .build();

        // 1st request succeeds (201 Created)
        mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 2nd request succeeds (201 Created)
        mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 3rd request succeeds (201 Created)
        mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 4th request MUST fail with 429 Too Many Requests
        mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Rate limit exceeded")));
    }

    @Test
    @DisplayName("2. Report fake request: user can report, duplicate report returns 400, 3 reports cancel request")
    void testReportFakeRequestWorkflow() throws Exception {
        // Create 1 request
        CreateBloodRequestDto dto = CreateBloodRequestDto.builder()
                .patientName("Fraud Suspect")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .latitude(28.6315)
                .longitude(77.2167)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        long requestId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        ReportRequestDto reportDto = ReportRequestDto.builder()
                .reason("Demanding money in exchange for hospital paperwork")
                .build();

        // Report 1: Donor 1 reports request -> 200 OK
        mockMvc.perform(post("/api/requests/" + requestId + "/report")
                        .header("Authorization", "Bearer " + donor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalReports").value(1))
                .andExpect(jsonPath("$.data.requestCancelled").value(false));

        // Duplicate report: Donor 1 reports again -> 400 Bad Request
        mockMvc.perform(post("/api/requests/" + requestId + "/report")
                        .header("Authorization", "Bearer " + donor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("already reported")));

        // Report 2: Donor 2 reports request -> 200 OK
        mockMvc.perform(post("/api/requests/" + requestId + "/report")
                        .header("Authorization", "Bearer " + donor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalReports").value(2))
                .andExpect(jsonPath("$.data.requestCancelled").value(false));

        // Request still PENDING after 2 reports
        BloodRequest after2Reports = bloodRequestRepository.findById(requestId).orElseThrow();
        assertEquals(RequestStatus.PENDING, after2Reports.getStatus());

        // Report 3: Donor 3 reports request -> Triggers automatic cancellation!
        mockMvc.perform(post("/api/requests/" + requestId + "/report")
                        .header("Authorization", "Bearer " + donor3Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalReports").value(3))
                .andExpect(jsonPath("$.data.requestCancelled").value(true));

        // Verify in database: BloodRequest is now CANCELLED
        BloodRequest after3Reports = bloodRequestRepository.findById(requestId).orElseThrow();
        assertEquals(RequestStatus.CANCELLED, after3Reports.getStatus());
    }
}
