package com.lifedrop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NearbyDonorSearchIntegrationTest {

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

    @Autowired
    private JwtUtil jwtUtil;

    private String recipientToken;
    private String donorToken;

    // Center point: Connaught Place, New Delhi (28.6315 N, 77.2167 E)
    private final double centerLat = 28.6315;
    private final double centerLng = 77.2167;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Recipient user searching for A+ blood
        User recipient = userRepository.save(User.builder()
                .name("Rohit Recipient")
                .email("rohit.recipient@example.com")
                .password("$2a$10$hashedPass")
                .phone("9123456789")
                .role(Role.RECIPIENT)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .city("Delhi")
                .latitude(centerLat)
                .longitude(centerLng)
                .available(false)
                .active(true)
                .build());
        recipientToken = jwtUtil.generateToken(recipient.getEmail(), recipient.getRole(), recipient.getId());

        // 2. Donor 1: MATCH! Compatible (A+), ~3 km away, available=true, eligible (last donation 120 days ago)
        userRepository.save(User.builder()
                .name("Anil Sharma")
                .email("anil.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543211")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(28)
                .city("Delhi")
                .latitude(28.6500)
                .longitude(77.2300)
                .available(true)
                .active(true)
                .lastDonatedDate(LocalDate.now().minusDays(120))
                .build());

        // 3. Donor 2: MATCH! Compatible (O- universal donor), ~4 km away, available=true, never donated
        userRepository.save(User.builder()
                .name("Pooja Verma")
                .email("pooja.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543212")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .age(25)
                .city("Delhi")
                .latitude(28.6100)
                .longitude(77.2100)
                .available(true)
                .active(true)
                .lastDonatedDate(null)
                .build());

        // 4. Donor 3: EXCLUDED! Incompatible blood group (B+ cannot donate to A+)
        userRepository.save(User.builder()
                .name("Bikram Singh")
                .email("bikram.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543213")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .age(31)
                .city("Delhi")
                .latitude(28.6320)
                .longitude(77.2170)
                .available(true)
                .active(true)
                .build());

        // 5. Donor 4: EXCLUDED! Compatible (O+), in range, but INELIGIBLE (donated 20 days ago)
        userRepository.save(User.builder()
                .name("Deepak Kumar")
                .email("deepak.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543214")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .age(27)
                .city("Delhi")
                .latitude(28.6300)
                .longitude(77.2180)
                .available(true)
                .active(true)
                .lastDonatedDate(LocalDate.now().minusDays(20))
                .build());

        // 6. Donor 5: EXCLUDED! Compatible (A-), in range, but available = FALSE
        userRepository.save(User.builder()
                .name("Sunil Mehta")
                .email("sunil.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543215")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_NEGATIVE)
                .age(33)
                .city("Delhi")
                .latitude(28.6310)
                .longitude(77.2160)
                .available(false)
                .active(true)
                .build());

        // 7. Donor 6: EXCLUDED! Compatible (A+), available, eligible, but 35 km AWAY (radius is 10 km)
        userRepository.save(User.builder()
                .name("Far Away Donor")
                .email("far.donor@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543216")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(30)
                .city("Faridabad")
                .latitude(28.4089)
                .longitude(77.3178)
                .available(true)
                .active(true)
                .build());

        donorToken = jwtUtil.generateToken("anil.donor@example.com", Role.DONOR, 999L);
    }

    @Test
    @DisplayName("1. Search nearby donors for recipient needing A+ returns only compatible, eligible, available donors within radiusKm")
    void testFindNearbyCompatibleDonors() throws Exception {
        mockMvc.perform(get("/api/recipient/donors/nearby")
                        .header("Authorization", "Bearer " + recipientToken)
                        .param("bloodGroup", "A+")
                        .param("lat", String.valueOf(centerLat))
                        .param("lng", String.valueOf(centerLng))
                        .param("radiusKm", "10.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2))) // Only Anil and Pooja
                // Verify firstName only (not full name) — ordered by distance ascending
                .andExpect(jsonPath("$.data[0].firstName").value("Anil"))
                .andExpect(jsonPath("$.data[0].bloodGroup").value("A+"))
                .andExpect(jsonPath("$.data[0].distanceKm").isNumber())
                .andExpect(jsonPath("$.data[0].city").value("Delhi"))
                // Verify donor 2
                .andExpect(jsonPath("$.data[1].firstName").value("Pooja"))
                .andExpect(jsonPath("$.data[1].bloodGroup").value("O-"))
                .andExpect(jsonPath("$.data[1].distanceKm").isNumber())
                // Verify privacy: phone, email, latitude, longitude MUST NOT exist in the response
                .andExpect(jsonPath("$.data[0].phone").doesNotExist())
                .andExpect(jsonPath("$.data[0].email").doesNotExist())
                .andExpect(jsonPath("$.data[0].latitude").doesNotExist())
                .andExpect(jsonPath("$.data[0].longitude").doesNotExist());
    }

    @Test
    @DisplayName("2. Expanding search radius to 40 km includes Far Away Donor")
    void testExpandingRadiusIncludesFarDonor() throws Exception {
        mockMvc.perform(get("/api/recipient/donors/nearby")
                        .header("Authorization", "Bearer " + recipientToken)
                        .param("bloodGroup", "A+")
                        .param("lat", String.valueOf(centerLat))
                        .param("lng", String.valueOf(centerLng))
                        .param("radiusKm", "45.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(3))); // Anil, Pooja, and Far Away Donor
    }

    @Test
    @DisplayName("3. Donor token calling /api/recipient/donors/nearby receives 403 Forbidden")
    void testDonorAccessRecipientSearchReturns403() throws Exception {
        mockMvc.perform(get("/api/recipient/donors/nearby")
                        .header("Authorization", "Bearer " + donorToken)
                        .param("bloodGroup", "A+")
                        .param("lat", String.valueOf(centerLat))
                        .param("lng", String.valueOf(centerLng)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
