package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.CreateBloodRequestDto;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.dto.UpdateCityRequest;
import com.lifedrop.entity.City;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import com.lifedrop.enums.Urgency;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.repository.NotificationRepository;
import com.lifedrop.repository.ReportRepository;
import com.lifedrop.repository.RequestResponseRepository;
import com.lifedrop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CityRepository cityRepository;

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
    private PasswordEncoder passwordEncoder;

    private String recipientToken;
    private Long recipientId;
    private String donorToken;
    private Long donorId;

    private City raipur;
    private City durg;

    @BeforeEach
    void setUp() throws Exception {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();

        // Retrieve seeded cities
        List<City> cities = cityRepository.findByActiveTrueOrderBySortOrderAscNameAsc();
        raipur = cities.stream().filter(c -> "Raipur".equalsIgnoreCase(c.getName())).findFirst().orElse(null);
        durg = cities.stream().filter(c -> "Durg".equalsIgnoreCase(c.getName())).findFirst().orElse(null);

        assertNotNull(raipur, "Raipur should be seeded");
        assertNotNull(durg, "Durg should be seeded");

        String encodedPassword = passwordEncoder.encode("Password@123");

        // Create test recipient in Raipur
        User recipient = userRepository.save(User.builder()
                .name("Test Recipient")
                .email("recipient.citytest@lifedrop.test")
                .password(encodedPassword)
                .phone("9800001111")
                .role(Role.RECIPIENT)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .city("Raipur")
                .cityRef(raipur)
                .latitude(21.2514)
                .longitude(81.6296)
                .available(false)
                .active(true)
                .build());
        recipientId = recipient.getId();

        // Create test donor in Raipur
        User donor = userRepository.save(User.builder()
                .name("Raipur Donor")
                .email("donor.citytest@lifedrop.test")
                .password(encodedPassword)
                .phone("9800002222")
                .role(Role.USER)
                .donorEnabled(true)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .city("Raipur")
                .cityRef(raipur)
                .latitude(21.2520)
                .longitude(81.6300)
                .available(true)
                .active(true)
                .build());
        donorId = donor.getId();

        recipientToken = login("recipient.citytest@lifedrop.test", "Password@123");
        donorToken = login("donor.citytest@lifedrop.test", "Password@123");
    }

    private String login(String email, String password) throws Exception {
        LoginRequest req = LoginRequest.builder().email(email).password(password).build();
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        return json.get("data").get("token").asText();
    }

    // ─── 1. /api/cities tests ───

    @Test
    @DisplayName("GET /api/cities is public and returns seeded active cities ordered by sortOrder then name")
    void testGetActiveCities_isPublicAndOrdered() throws Exception {
        mockMvc.perform(get("/api/cities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(5))))
                .andExpect(jsonPath("$.data[0].name").value("Raipur"))
                .andExpect(jsonPath("$.data[0].state").value("Chhattisgarh"))
                .andExpect(jsonPath("$.data[0].sortOrder").value(1))
                .andExpect(jsonPath("$.data[1].name").value("Raigarh"))
                .andExpect(jsonPath("$.data[2].name").value("Bilaspur"))
                .andExpect(jsonPath("$.data[3].name").value("Durg"))
                .andExpect(jsonPath("$.data[4].name").value("Ambikapur"));
    }

    // ─── 2. PUT /api/users/city tests ───

    @Test
    @DisplayName("PUT /api/users/city without authentication returns 401 Unauthorized")
    void testUpdateCity_unauthenticatedReturns401() throws Exception {
        UpdateCityRequest req = new UpdateCityRequest();
        req.setCityId(durg.getId());

        mockMvc.perform(put("/api/users/city")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/users/city with valid cityId updates user city and returns cityId and cityName in UserProfileResponse")
    void testUpdateCity_validCityIdUpdatesProfile() throws Exception {
        UpdateCityRequest req = new UpdateCityRequest();
        req.setCityId(durg.getId());

        mockMvc.perform(put("/api/users/city")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cityId").value(durg.getId()))
                .andExpect(jsonPath("$.data.cityName").value("Durg"))
                .andExpect(jsonPath("$.data.city").value("Durg"));

        User updated = userRepository.findById(recipientId).orElseThrow();
        assertEquals(durg.getId(), updated.getCityId());
        assertEquals("Durg", updated.getCity());
    }

    @Test
    @DisplayName("PUT /api/users/city with unknown cityId returns 404 Not Found")
    void testUpdateCity_unknownIdReturns404() throws Exception {
        UpdateCityRequest req = new UpdateCityRequest();
        req.setCityId(999999L);

        mockMvc.perform(put("/api/users/city")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    // ─── 3. cityId filter tests ───

    @Test
    @DisplayName("Blood request creation copies requester's cityId into request")
    void testCreateRequest_copiesRequesterCityId() throws Exception {
        CreateBloodRequestDto dto = CreateBloodRequestDto.builder()
                .patientName("City Patient")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Raipur")
                .latitude(21.2514)
                .longitude(81.6296)
                .radiusKm(10.0)
                .build();

        MvcResult result = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.cityId").value(raipur.getId()))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        long requestId = json.get("data").get("id").asLong();

        var saved = bloodRequestRepository.findById(requestId).orElseThrow();
        assertEquals(raipur.getId(), saved.getCityId());
    }

    @Test
    @DisplayName("GET /api/recipient/donors/nearby with cityId filters donors by cityId")
    void testNearbyDonors_filtersByCityId() throws Exception {
        // Create second donor located close to Raipur (~2 km) but belonging to Durg city
        userRepository.save(User.builder()
                .name("Durg Donor Nearby")
                .email("durg.donor@lifedrop.test")
                .password(passwordEncoder.encode("Password@123"))
                .phone("9800003333")
                .role(Role.USER)
                .donorEnabled(true)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .city("Durg")
                .cityRef(durg)
                .latitude(21.2530)
                .longitude(81.6310)
                .available(true)
                .active(true)
                .build());

        // 1. Without cityId: default radius search returns BOTH donors within radius
        mockMvc.perform(get("/api/recipient/donors/nearby")
                        .header("Authorization", "Bearer " + recipientToken)
                        .param("bloodGroup", "A+")
                        .param("lat", "21.2514")
                        .param("lng", "81.6296")
                        .param("radiusKm", "10.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));

        // 2. With cityId = raipur.id: only Raipur donor returned
        mockMvc.perform(get("/api/recipient/donors/nearby")
                        .header("Authorization", "Bearer " + recipientToken)
                        .param("bloodGroup", "A+")
                        .param("lat", "21.2514")
                        .param("lng", "81.6296")
                        .param("radiusKm", "10.0")
                        .param("cityId", String.valueOf(raipur.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].firstName").value("Raipur"));

        // 3. With cityId = durg.id: only Durg donor returned
        mockMvc.perform(get("/api/recipient/donors/nearby")
                        .header("Authorization", "Bearer " + recipientToken)
                        .param("bloodGroup", "A+")
                        .param("lat", "21.2514")
                        .param("lng", "81.6296")
                        .param("radiusKm", "10.0")
                        .param("cityId", String.valueOf(durg.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].firstName").value("Durg"));
    }

    @Test
    @DisplayName("GET /api/donor/requests with optional cityId filters available requests by cityId")
    void testDonorRequests_filtersByCityId() throws Exception {
        // Create request in Raipur
        CreateBloodRequestDto dto = CreateBloodRequestDto.builder()
                .patientName("Raipur Patient")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Raipur")
                .latitude(21.2514)
                .longitude(81.6296)
                .radiusKm(10.0)
                .build();

        mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 1. Without cityId: donor sees the incoming request
        mockMvc.perform(get("/api/donor/requests")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));

        // 2. With matching cityId (Raipur): donor sees the request
        mockMvc.perform(get("/api/donor/requests")
                        .header("Authorization", "Bearer " + donorToken)
                        .param("cityId", String.valueOf(raipur.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].cityId").value(raipur.getId()));

        // 3. With non-matching cityId (Durg): donor sees 0 requests
        mockMvc.perform(get("/api/donor/requests")
                        .header("Authorization", "Bearer " + donorToken)
                        .param("cityId", String.valueOf(durg.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        // 4. Test alias /api/donor/requests/available as well
        mockMvc.perform(get("/api/donor/requests/available")
                        .header("Authorization", "Bearer " + donorToken)
                        .param("cityId", String.valueOf(raipur.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }
}

