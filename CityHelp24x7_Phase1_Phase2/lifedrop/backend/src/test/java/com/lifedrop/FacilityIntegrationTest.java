package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.FacilityRequest;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.entity.City;
import com.lifedrop.entity.Facility;
import com.lifedrop.entity.User;
import com.lifedrop.enums.FacilityType;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.repository.FacilityRepository;
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

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FacilityIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CityRepository cityRepository;
    @Autowired private FacilityRepository facilityRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BloodRequestRepository bloodRequestRepository;
    @Autowired private RequestResponseRepository requestResponseRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ReportRepository reportRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private City raipur;
    private City durg;
    private String userToken;
    private String adminToken;

    private Facility nearHospital;
    private Facility farBloodBank;
    private Facility durgHospital;

    @BeforeEach
    void setUp() throws Exception {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();
        facilityRepository.deleteAll();

        raipur = cityRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .filter(c -> "Raipur".equalsIgnoreCase(c.getName())).findFirst().orElse(null);
        durg = cityRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .filter(c -> "Durg".equalsIgnoreCase(c.getName())).findFirst().orElse(null);
        assertNotNull(raipur, "Raipur should be seeded");
        assertNotNull(durg, "Durg should be seeded");

        String pwd = passwordEncoder.encode("Password@123");
        userRepository.save(User.builder().name("Facility User").email("facility.user@lifedrop.test")
                .password(pwd).phone("9811100001").role(Role.USER).active(true).build());
        userRepository.save(User.builder().name("Facility Admin").email("facility.admin@lifedrop.test")
                .password(pwd).phone("9811100002").role(Role.ADMIN).active(true).build());
        userToken = login("facility.user@lifedrop.test");
        adminToken = login("facility.admin@lifedrop.test");

        nearHospital = save(FacilityType.HOSPITAL, "Sample Hospital Near", raipur.getId(), 21.2530, 81.6310, true);
        farBloodBank = save(FacilityType.BLOOD_BANK, "Sample Blood Bank Far", raipur.getId(), 21.3000, 81.7000, false);
        durgHospital = save(FacilityType.HOSPITAL, "Durg General", durg.getId(), 21.1904, 81.2849, false);
    }

    private Facility save(FacilityType type, String name, Long cityId, double lat, double lng, boolean open24x7) {
        return facilityRepository.save(Facility.builder()
                .type(type).name(name).address("Some road, test city").phone("0000000000")
                .cityId(cityId).latitude(lat).longitude(lng).open24x7(open24x7).active(true).build());
    }

    private String login(String email) throws Exception {
        LoginRequest req = LoginRequest.builder().email(email).password("Password@123").build();
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        return json.get("data").get("token").asText();
    }

    @Test
    @DisplayName("GET /api/facilities requires authentication")
    void list_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/facilities")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Filter by type returns only that type")
    void list_filterByType() throws Exception {
        mockMvc.perform(get("/api/facilities").param("type", "HOSPITAL")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content", hasSize(2)));

        mockMvc.perform(get("/api/facilities").param("type", "BLOOD_BANK")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Sample Blood Bank Far"))
                .andExpect(jsonPath("$.data.content[0].sample").value(true));
    }

    @Test
    @DisplayName("Filter by cityId, open24x7 and text")
    void list_filterByCityOpenAndText() throws Exception {
        mockMvc.perform(get("/api/facilities").param("cityId", String.valueOf(raipur.getId()))
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2));

        mockMvc.perform(get("/api/facilities").param("open24x7", "true")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Sample Hospital Near"));

        mockMvc.perform(get("/api/facilities").param("q", "durg")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Durg General"));
    }

    @Test
    @DisplayName("With lat/lng the list is ordered by distance and carries distanceKm; radius filters far entries")
    void list_distanceOrderAndRadius() throws Exception {
        mockMvc.perform(get("/api/facilities")
                        .param("cityId", String.valueOf(raipur.getId()))
                        .param("lat", "21.2514").param("lng", "81.6296")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("Sample Hospital Near"))
                .andExpect(jsonPath("$.data.content[0].distanceKm").isNumber())
                .andExpect(jsonPath("$.data.content[1].name").value("Sample Blood Bank Far"));

        mockMvc.perform(get("/api/facilities")
                        .param("cityId", String.valueOf(raipur.getId()))
                        .param("lat", "21.2514").param("lng", "81.6296").param("radiusKm", "3")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Sample Hospital Near"));
    }

    @Test
    @DisplayName("Invalid latitude returns 400")
    void list_invalidLatitude() throws Exception {
        mockMvc.perform(get("/api/facilities").param("lat", "123").param("lng", "81")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Paging returns the requested slice")
    void list_paging() throws Exception {
        mockMvc.perform(get("/api/facilities").param("page", "0").param("size", "2")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2));
    }

    @Test
    @DisplayName("GET /api/facilities/{id} returns details; unknown id returns 404")
    void getById() throws Exception {
        mockMvc.perform(get("/api/facilities/" + nearHospital.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Sample Hospital Near"));

        mockMvc.perform(get("/api/facilities/999999")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Normal user cannot write admin endpoints (403); unauthenticated gets 401")
    void admin_forbiddenForNormalUser() throws Exception {
        String body = objectMapper.writeValueAsString(validRequest("Blocked Hospital"));

        mockMvc.perform(post("/api/admin/facilities").contentType(MediaType.APPLICATION_JSON).content(body)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/admin/facilities").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin can create, update and soft delete; a soft deleted entry disappears from lists")
    void admin_createUpdateDelete() throws Exception {
        String createBody = objectMapper.writeValueAsString(validRequest("Admin Added Hospital"));
        MvcResult created = mockMvc.perform(post("/api/admin/facilities")
                        .contentType(MediaType.APPLICATION_JSON).content(createBody)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Admin Added Hospital"))
                .andExpect(jsonPath("$.data.sample").value(false))
                .andReturn();
        long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("data").get("id").asLong();

        FacilityRequest update = validRequest("Admin Renamed Hospital");
        mockMvc.perform(put("/api/admin/facilities/" + id)
                        .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(update))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Admin Renamed Hospital"));

        mockMvc.perform(delete("/api/admin/facilities/" + id)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertFalse(facilityRepository.findById(id).orElseThrow().getActive());

        mockMvc.perform(get("/api/facilities/" + id).header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/facilities").param("q", "renamed")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    @DisplayName("Admin create validates required fields and the city id")
    void admin_validation() throws Exception {
        FacilityRequest noName = validRequest(" ");
        mockMvc.perform(post("/api/admin/facilities").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noName))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        FacilityRequest badCity = validRequest("Ghost City Hospital");
        badCity.setCityId(987654L);
        mockMvc.perform(post("/api/admin/facilities").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badCity))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    private FacilityRequest validRequest(String name) {
        return FacilityRequest.builder()
                .type(FacilityType.HOSPITAL)
                .name(name)
                .address("1 Test Road, Raipur")
                .phone("0000000000")
                .cityId(raipur.getId())
                .latitude(21.25)
                .longitude(81.63)
                .open24x7(true)
                .verified(false)
                .build();
    }
}
