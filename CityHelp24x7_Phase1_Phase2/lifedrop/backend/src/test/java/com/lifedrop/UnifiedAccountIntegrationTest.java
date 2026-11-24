package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.config.RoleMigrationRunner;
import com.lifedrop.dto.AvailabilityRequest;
import com.lifedrop.dto.CreateBloodRequestDto;
import com.lifedrop.dto.RegisterRequest;
import com.lifedrop.dto.UpdateCityRequest;
import com.lifedrop.dto.UpdateDonorProfileRequest;
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
import com.lifedrop.security.JwtUtil;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UnifiedAccountIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CityRepository cityRepository;

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

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RoleMigrationRunner roleMigrationRunner;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Register without role defaults to USER with donorEnabled=false; donor=true validates age & bloodGroup")
    void testRegisterWithoutRoleDefaultsToUser() throws Exception {
        // Plain registration without role -> USER, donorEnabled=false
        RegisterRequest plainUser = RegisterRequest.builder()
                .name("Unified User")
                .email("unified@example.com")
                .password("Password@123")
                .phone("9876543210")
                .city("Raipur")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(plainUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.role").value("USER"))
                .andExpect(jsonPath("$.data.user.donorEnabled").value(false))
                .andExpect(jsonPath("$.data.user.cityId").doesNotExist())
                .andReturn();

        String token = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // /api/auth/me includes donorEnabled and cityId
        City raipur = cityRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .filter(c -> "Raipur".equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseThrow();

        UpdateCityRequest cityReq = new UpdateCityRequest();
        cityReq.setCityId(raipur.getId());
        mockMvc.perform(put("/api/users/city")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cityReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.donorEnabled").value(false))
                .andExpect(jsonPath("$.data.cityId").value(raipur.getId()));

        // Registration with donor=true and missing bloodGroup fails 400
        RegisterRequest missingBg = RegisterRequest.builder()
                .name("Donor Missing BG")
                .email("missingbg@example.com")
                .password("Password@123")
                .phone("9876543211")
                .donor(true)
                .age(25)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingBg)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Blood group is required for donors"));

        // Registration with donor=true and valid age/bloodGroup creates USER with donorEnabled=true
        RegisterRequest donorFlagUser = RegisterRequest.builder()
                .name("Donor Flag User")
                .email("donorflag@example.com")
                .password("Password@123")
                .phone("9876543212")
                .donor(true)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .age(28)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donorFlagUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.role").value("USER"))
                .andExpect(jsonPath("$.data.user.donorEnabled").value(true));

        // Self-registration as ADMIN is rejected
        RegisterRequest adminAttempt = RegisterRequest.builder()
                .name("Fake Admin")
                .email("fakeadmin@example.com")
                .password("Password@123")
                .phone("9876543213")
                .role(Role.ADMIN)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminAttempt)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("2. Non-donor (donorEnabled=false) calling donor endpoints receives 403 'Enable your donor profile first'")
    void testNonDonorCallingDonorEndpointsReturns403() throws Exception {
        User nonDonor = userRepository.save(User.builder()
                .name("Non Donor User")
                .email("nondonor@example.com")
                .password(passwordEncoder.encode("Password@123"))
                .phone("9800001111")
                .role(Role.USER)
                .donorEnabled(false)
                .available(false)
                .active(true)
                .build());
        String token = jwtUtil.generateToken(nonDonor.getEmail(), nonDonor.getRole(), nonDonor.getId());

        mockMvc.perform(get("/api/donor/requests")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Enable your donor profile first"));

        mockMvc.perform(get("/api/donor/eligibility")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Enable your donor profile first"));

        AvailabilityRequest avail = AvailabilityRequest.builder().available(true).build();
        mockMvc.perform(put("/api/donor/availability")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(avail)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Enable your donor profile first"));

        mockMvc.perform(get("/api/donor/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Enable your donor profile first"));

        mockMvc.perform(get("/api/donor/test")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Enable your donor profile first"));
    }

    @Test
    @DisplayName("3. Enabling donor profile via PUT /api/users/donor-profile validates age 18-65 and unlocks donor endpoints")
    void testEnableDonorProfile() throws Exception {
        User user = userRepository.save(User.builder()
                .name("Becoming Donor")
                .email("becoming@example.com")
                .password(passwordEncoder.encode("Password@123"))
                .phone("9800002222")
                .role(Role.USER)
                .donorEnabled(false)
                .available(false)
                .active(true)
                .build());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        // Underage rejected with 400
        UpdateDonorProfileRequest underage = UpdateDonorProfileRequest.builder()
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(17)
                .gender("MALE")
                .available(true)
                .build();

        mockMvc.perform(put("/api/users/donor-profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(underage)))
                .andExpect(status().isBadRequest());

        // Overage rejected with 400
        UpdateDonorProfileRequest overage = UpdateDonorProfileRequest.builder()
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(66)
                .gender("MALE")
                .available(true)
                .build();

        mockMvc.perform(put("/api/users/donor-profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overage)))
                .andExpect(status().isBadRequest());

        // Valid request enables donorEnabled=true
        UpdateDonorProfileRequest valid = UpdateDonorProfileRequest.builder()
                .bloodGroup(BloodGroup.B_POSITIVE)
                .age(29)
                .gender("MALE")
                .available(true)
                .build();

        mockMvc.perform(put("/api/users/donor-profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(valid)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.donorEnabled").value(true))
                .andExpect(jsonPath("$.data.bloodGroup").value("B+"))
                .andExpect(jsonPath("$.data.age").value(29))
                .andExpect(jsonPath("$.data.available").value(true));

        // Donor endpoint now succeeds
        mockMvc.perform(get("/api/donor/eligibility")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(true));
    }

    @Test
    @DisplayName("4. A donor requesting blood is NOT matched to their own request")
    void testDonorRequestingBloodIsNotMatchedToOwnRequest() throws Exception {
        double lat = 21.2514;
        double lng = 81.6296;

        // Donor A requests A+ blood at their own exact coordinates
        User donorRequester = userRepository.save(User.builder()
                .name("Self Requester Donor")
                .email("selfrequester@example.com")
                .password(passwordEncoder.encode("Password@123"))
                .phone("9800003333")
                .role(Role.USER)
                .donorEnabled(true)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(30)
                .city("Raipur")
                .latitude(lat)
                .longitude(lng)
                .available(true)
                .active(true)
                .build());
        String requesterToken = jwtUtil.generateToken(
                donorRequester.getEmail(), donorRequester.getRole(), donorRequester.getId());

        // Another eligible donor nearby
        User otherDonor = userRepository.save(User.builder()
                .name("Other Nearby Donor")
                .email("otherdonor@example.com")
                .password(passwordEncoder.encode("Password@123"))
                .phone("9800004444")
                .role(Role.USER)
                .donorEnabled(true)
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .age(27)
                .city("Raipur")
                .latitude(21.2520)
                .longitude(81.6300)
                .available(true)
                .active(true)
                .build());

        CreateBloodRequestDto dto = CreateBloodRequestDto.builder()
                .patientName("Self Patient")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Raipur")
                .latitude(lat)
                .longitude(lng)
                .radiusKm(10.0)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/recipient/requests")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.matchedDonorCount").value(1))
                .andReturn();

        long reqId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // Self must NOT appear in their own donor incoming requests
        mockMvc.perform(get("/api/donor/requests")
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        // Verify in DB only otherDonor got a RequestResponse
        assertFalse(requestResponseRepository.findByRequestIdAndDonorId(reqId, donorRequester.getId()).isPresent());
        assertTrue(requestResponseRepository.findByRequestIdAndDonorId(reqId, otherDonor.getId()).isPresent());
    }

    @Test
    @DisplayName("5. Legacy DONOR/RECIPIENT tokens still work and RoleMigrationRunner migrates legacy DONORs idempotently")
    void testLegacyTokensAndRoleMigration() throws Exception {
        // Legacy DONOR persisted with donorEnabled=false (pre-migration row)
        User legacyDonor = userRepository.save(User.builder()
                .name("Legacy Donor")
                .email("legacydonor@example.com")
                .password(passwordEncoder.encode("Password@123"))
                .phone("9800005555")
                .role(Role.DONOR)
                .donorEnabled(false)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .age(32)
                .available(true)
                .active(true)
                .build());

        // Legacy RECIPIENT
        User legacyRecipient = userRepository.save(User.builder()
                .name("Legacy Recipient")
                .email("legacyrecipient@example.com")
                .password(passwordEncoder.encode("Password@123"))
                .phone("9800006666")
                .role(Role.RECIPIENT)
                .donorEnabled(false)
                .available(false)
                .active(true)
                .build());

        // Run idempotent startup migration twice
        roleMigrationRunner.run();
        roleMigrationRunner.run();

        User migratedDonor = userRepository.findById(legacyDonor.getId()).orElseThrow();
        User unchangedRecipient = userRepository.findById(legacyRecipient.getId()).orElseThrow();
        assertTrue(migratedDonor.getDonorEnabled());
        assertEquals(Role.DONOR, migratedDonor.getRole());
        assertFalse(unchangedRecipient.getDonorEnabled());

        String legacyDonorToken = jwtUtil.generateToken(migratedDonor.getEmail(), migratedDonor.getRole(), migratedDonor.getId());
        String legacyRecipientToken = jwtUtil.generateToken(unchangedRecipient.getEmail(), unchangedRecipient.getRole(), unchangedRecipient.getId());

        // Legacy DONOR can call both /api/donor/** and /api/recipient/**
        mockMvc.perform(get("/api/donor/test")
                        .header("Authorization", "Bearer " + legacyDonorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("DONOR"));

        mockMvc.perform(get("/api/recipient/test")
                        .header("Authorization", "Bearer " + legacyDonorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("DONOR"));

        // Legacy RECIPIENT can call /api/recipient/**, gets 403 on /api/donor/**
        mockMvc.perform(get("/api/recipient/test")
                        .header("Authorization", "Bearer " + legacyRecipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("RECIPIENT"));

        mockMvc.perform(get("/api/donor/test")
                        .header("Authorization", "Bearer " + legacyRecipientToken))
                .andExpect(status().isForbidden());

        // Non-admin cannot access /api/admin/** (403)
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + legacyDonorToken))
                .andExpect(status().isForbidden());
    }
}

