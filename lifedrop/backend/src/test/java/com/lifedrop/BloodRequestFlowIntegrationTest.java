package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.CreateBloodRequestDto;
import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.RequestResponse;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.ResponseStatus;
import com.lifedrop.enums.Role;
import com.lifedrop.enums.Urgency;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.RequestResponseRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.security.JwtUtil;
import com.lifedrop.service.BloodRequestService;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BloodRequestFlowIntegrationTest {

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
    private com.lifedrop.repository.NotificationRepository notificationRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private BloodRequestService bloodRequestService;

    @Autowired
    private com.lifedrop.repository.ReportRepository reportRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User recipient;
    private User donor1;
    private User donor2;
    private User outsiderDonor;

    private String recipientToken;
    private String donor1Token;
    private String donor2Token;
    private String outsiderDonorToken;

    private final double centerLat = 28.6315;
    private final double centerLng = 77.2167;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Recipient
        recipient = userRepository.save(User.builder()
                .name("Rahul Verma")
                .email("rahul.recipient@example.com")
                .password("$2a$10$hashedPass")
                .phone("9811122233")
                .role(Role.RECIPIENT)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .city("Delhi")
                .latitude(centerLat)
                .longitude(centerLng)
                .available(false)
                .active(true)
                .build());
        recipientToken = jwtUtil.generateToken(recipient.getEmail(), recipient.getRole(), recipient.getId());

        // 2. Donor 1 (Compatible A+, 2 km away, available & eligible)
        donor1 = userRepository.save(User.builder()
                .name("Amit Kumar")
                .email("amit.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9822233344")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(28)
                .gender("MALE")
                .city("Delhi")
                .latitude(28.6400)
                .longitude(77.2200)
                .available(true)
                .active(true)
                .lastDonatedDate(LocalDate.now().minusDays(100))
                .build());
        donor1Token = jwtUtil.generateToken(donor1.getEmail(), donor1.getRole(), donor1.getId());

        // 3. Donor 2 (Compatible O-, 3 km away, available & eligible)
        donor2 = userRepository.save(User.builder()
                .name("Sneha Patel")
                .email("sneha.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9833344455")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .age(26)
                .gender("FEMALE")
                .city("Delhi")
                .latitude(28.6200)
                .longitude(77.2100)
                .available(true)
                .active(true)
                .lastDonatedDate(null)
                .build());
        donor2Token = jwtUtil.generateToken(donor2.getEmail(), donor2.getRole(), donor2.getId());

        // 4. Outsider Donor (in Far Away city, not matched to request)
        outsiderDonor = userRepository.save(User.builder()
                .name("Far Out Donor")
                .email("farout.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9844455566")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(35)
                .gender("MALE")
                .city("Mumbai")
                .latitude(19.0760)
                .longitude(72.8777)
                .available(true)
                .active(true)
                .build());
        outsiderDonorToken = jwtUtil.generateToken(outsiderDonor.getEmail(), outsiderDonor.getRole(), outsiderDonor.getId());
    }

    @Test
    @DisplayName("Complete blood request flow: create -> donor1 accepts -> donor2 accept fails with 409 -> recipient completes -> donor1 lastDonatedDate updated")
    void testCompleteBloodRequestFlow() throws Exception {
        // =========================================================================
        // STEP 1: Recipient creates a blood request
        // =========================================================================
        CreateBloodRequestDto createDto = CreateBloodRequestDto.builder()
                .patientName("Aarav Verma")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(2)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .latitude(centerLat)
                .longitude(centerLng)
                .radiusKm(10.0)
                .message("Urgent surgery scheduled at Delhi Hospital")
                .requiredBy(LocalDateTime.now().plusHours(12))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.patientName").value("Aarav Verma"))
                .andExpect(jsonPath("$.data.bloodGroup").value("A+"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.matchedDonorCount").value(2))
                .andExpect(jsonPath("$.data.acceptedDonor").doesNotExist()) // Donor contact strictly hidden while PENDING
                .andReturn();

        JsonNode createJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long requestId = createJson.get("data").get("id").asLong();

        // Verify database: 1 BloodRequest and 2 RequestResponse records (both PENDING)
        BloodRequest savedRequest = bloodRequestRepository.findById(requestId).orElseThrow();
        assertEquals(RequestStatus.PENDING, savedRequest.getStatus());
        assertEquals(2, requestResponseRepository.countByRequestId(requestId));

        // =========================================================================
        // STEP 2: Donor 1 views incoming requests feed
        // =========================================================================
        mockMvc.perform(get("/api/donor/requests")
                        .header("Authorization", "Bearer " + donor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].requestId").value(requestId))
                .andExpect(jsonPath("$.data[0].patientName").value("Aarav Verma"))
                .andExpect(jsonPath("$.data[0].bloodGroup").value("A+"))
                .andExpect(jsonPath("$.data[0].myResponseStatus").value("PENDING"))
                .andExpect(jsonPath("$.data[0].distanceKm").isNumber());

        // Donor 1 views request details: Recipient phone MUST NOT be exposed before acceptance
        mockMvc.perform(get("/api/donor/requests/" + requestId)
                        .header("Authorization", "Bearer " + donor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recipientFirstName").value("Rahul"))
                .andExpect(jsonPath("$.data.recipientPhone").doesNotExist());

        // =========================================================================
        // STEP 3: Donor 1 accepts the request
        // =========================================================================
        mockMvc.perform(post("/api/donor/requests/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + donor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.requestId").value(requestId))
                .andExpect(jsonPath("$.data.recipientName").value("Rahul Verma"))
                .andExpect(jsonPath("$.data.recipientPhone").value("9811122233")) // Phone now revealed to winner
                .andExpect(jsonPath("$.data.acceptedAt").isString());

        // Verify request is now ACCEPTED and acceptedDonor is Donor 1
        BloodRequest acceptedRequest = bloodRequestRepository.findById(requestId).orElseThrow();
        assertEquals(RequestStatus.ACCEPTED, acceptedRequest.getStatus());
        assertEquals(donor1.getId(), acceptedRequest.getAcceptedDonor().getId());

        // Verify Donor 1 response is ACCEPTED, Donor 2 response is EXPIRED
        RequestResponse r1 = requestResponseRepository.findByRequestIdAndDonorId(requestId, donor1.getId()).orElseThrow();
        RequestResponse r2 = requestResponseRepository.findByRequestIdAndDonorId(requestId, donor2.getId()).orElseThrow();
        assertEquals(ResponseStatus.ACCEPTED, r1.getStatus());
        assertEquals(ResponseStatus.EXPIRED, r2.getStatus());

        // =========================================================================
        // STEP 4: Donor 2 attempts to accept the same request -> 409 Conflict!
        // =========================================================================
        mockMvc.perform(post("/api/donor/requests/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + donor2Token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", equalTo("Request has already been accepted or is no longer available.")));

        // =========================================================================
        // STEP 5: Recipient views request details -> Donor contact is now visible
        // =========================================================================
        mockMvc.perform(get("/api/recipient/requests/" + requestId)
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.acceptedDonor.id").value(donor1.getId()))
                .andExpect(jsonPath("$.data.acceptedDonor.name").value("Amit Kumar"))
                .andExpect(jsonPath("$.data.acceptedDonor.phone").value("9822233344")); // Donor phone revealed!

        // Donor 1 views details now: recipient phone is present
        mockMvc.perform(get("/api/donor/requests/" + requestId)
                        .header("Authorization", "Bearer " + donor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recipientPhone").value("9811122233"));

        // =========================================================================
        // STEP 6: Recipient completes the request -> Donor lastDonatedDate = today
        // =========================================================================
        mockMvc.perform(post("/api/recipient/requests/" + requestId + "/complete")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // Verify in database: BloodRequest is COMPLETED
        BloodRequest completedRequest = bloodRequestRepository.findById(requestId).orElseThrow();
        assertEquals(RequestStatus.COMPLETED, completedRequest.getStatus());

        // Verify in database: Donor 1's lastDonatedDate is updated to today!
        User updatedDonor1 = userRepository.findById(donor1.getId()).orElseThrow();
        assertEquals(LocalDate.now(), updatedDonor1.getLastDonatedDate());

        // =========================================================================
        // STEP 7: Donor 1 checks donation history
        // =========================================================================
        mockMvc.perform(get("/api/donor/history")
                        .header("Authorization", "Bearer " + donor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].requestId").value(requestId))
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.data[0].recipientPhone").value("9811122233"));
    }

    @Test
    @DisplayName("Outsider donor cannot view or respond to a request not matched to them")
    void testOutsiderDonorAccessForbidden() throws Exception {
        CreateBloodRequestDto createDto = CreateBloodRequestDto.builder()
                .patientName("Priya Verma")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .latitude(centerLat)
                .longitude(centerLng)
                .radiusKm(5.0)
                .build();

        MvcResult result = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();

        long reqId = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Outsider attempts to get details -> 403 Forbidden
        mockMvc.perform(get("/api/donor/requests/" + reqId)
                        .header("Authorization", "Bearer " + outsiderDonorToken))
                .andExpect(status().isForbidden());

        // Outsider attempts to accept -> 403 Forbidden
        mockMvc.perform(post("/api/donor/requests/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + outsiderDonorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Recipient cancels request: status becomes CANCELLED and pending responses EXPIRED")
    void testRecipientCancelRequest() throws Exception {
        CreateBloodRequestDto createDto = CreateBloodRequestDto.builder()
                .patientName("Karan Verma")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .latitude(centerLat)
                .longitude(centerLng)
                .build();

        MvcResult result = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();

        long reqId = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();

        mockMvc.perform(put("/api/recipient/requests/" + reqId + "/cancel")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        BloodRequest cancelled = bloodRequestRepository.findById(reqId).orElseThrow();
        assertEquals(RequestStatus.CANCELLED, cancelled.getStatus());

        List<RequestResponse> responses = requestResponseRepository.findByRequestId(reqId);
        for (RequestResponse rr : responses) {
            assertEquals(ResponseStatus.EXPIRED, rr.getStatus());
        }
    }

    @Test
    @DisplayName("Completing request fails if request is not in ACCEPTED status")
    void testCompleteFailsIfNotAccepted() throws Exception {
        CreateBloodRequestDto createDto = CreateBloodRequestDto.builder()
                .patientName("Simran Verma")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .latitude(centerLat)
                .longitude(centerLng)
                .build();

        MvcResult result = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();

        long reqId = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();

        // While still PENDING, complete should fail with 400 Bad Request
        mockMvc.perform(post("/api/recipient/requests/" + reqId + "/complete")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Scheduler expiration: PENDING requests older than 24 hours are expired")
    void testSchedulerExpireOldPendingRequests() {
        // Create an old pending request directly in repository
        BloodRequest oldRequest = bloodRequestRepository.save(BloodRequest.builder()
                .recipient(recipient)
                .patientName("Old Patient")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .latitude(centerLat)
                .longitude(centerLng)
                .radiusKm(10.0)
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now().minusHours(25))
                .build());

        RequestResponse pendingResponse = requestResponseRepository.save(RequestResponse.builder()
                .request(oldRequest)
                .donor(donor1)
                .status(ResponseStatus.PENDING)
                .build());

        // Backdate createdAt directly in DB bypassing Hibernate @CreationTimestamp
        jdbcTemplate.update("UPDATE blood_requests SET created_at = ? WHERE id = ?",
                LocalDateTime.now().minusHours(25), oldRequest.getId());

        // Execute expiration logic
        int expired = bloodRequestService.expireOldPendingRequests();
        assertEquals(1, expired);

        BloodRequest refreshed = bloodRequestRepository.findById(oldRequest.getId()).orElseThrow();
        assertEquals(RequestStatus.EXPIRED, refreshed.getStatus());

        RequestResponse refreshedResponse = requestResponseRepository.findById(pendingResponse.getId()).orElseThrow();
        assertEquals(ResponseStatus.EXPIRED, refreshedResponse.getStatus());
    }
}
