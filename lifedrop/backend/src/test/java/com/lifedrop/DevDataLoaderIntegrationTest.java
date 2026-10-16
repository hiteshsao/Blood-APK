package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.CreateBloodRequestDto;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import com.lifedrop.enums.Urgency;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.NotificationRepository;
import com.lifedrop.repository.ReportRepository;
import com.lifedrop.repository.RequestResponseRepository;
import com.lifedrop.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "dev"})
class DevDataLoaderIntegrationTest {

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

    // Indore Center: 22.7196 N, 75.8577 E
    private final double indoreLat = 22.7196;
    private final double indoreLng = 75.8577;

    @Test
    @DisplayName("Verify DevDataLoader seeds 12 Indore donors + 2 recipients, and an A+ request matches seeded donors")
    void testDevProfileSeedAndAplusMatching() throws Exception {
        // 1. Verify seeded users in database
        List<User> donors = userRepository.findByRole(Role.DONOR);
        List<User> recipients = userRepository.findByRole(Role.RECIPIENT);

        assertEquals(12, donors.size(), "Should have exactly 12 seeded donors");
        assertEquals(2, recipients.size(), "Should have exactly 2 seeded recipients");

        // Verify all donors are in Indore
        for (User donor : donors) {
            assertEquals("Indore", donor.getCity());
            assertNotNull(donor.getLatitude());
            assertNotNull(donor.getLongitude());
            assertTrue(donor.getAvailable());
        }

        // 2. Authenticate as seeded recipient1@lifedrop.test with Password@123
        LoginRequest loginRequest = LoginRequest.builder()
                .email("recipient1@lifedrop.test")
                .password("Password@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // 3. Search nearby compatible donors for A+ within 10 km around Indore
        mockMvc.perform(get("/api/recipient/donors/nearby")
                        .header("Authorization", "Bearer " + token)
                        .param("bloodGroup", "A+")
                        .param("lat", String.valueOf(indoreLat))
                        .param("lng", String.valueOf(indoreLng))
                        .param("radiusKm", "10.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(4)))); // Compatible in Indore

        // 4. Create blood request for A+ in Indore -> automatically matches seeded donors!
        CreateBloodRequestDto requestDto = CreateBloodRequestDto.builder()
                .patientName("Indore Patient")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(2)
                .urgency(Urgency.NORMAL)
                .city("Indore")
                .latitude(indoreLat)
                .longitude(indoreLng)
                .radiusKm(10.0)
                .message("Urgent need in Indore city")
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.matchedDonorCount", greaterThanOrEqualTo(4)))
                .andReturn();

        JsonNode json = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long createdRequestId = json.get("data").get("id").asLong();
        assertTrue(createdRequestId > 0);
    }
}
