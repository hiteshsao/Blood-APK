package com.lifedrop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.AvailabilityRequest;
import com.lifedrop.dto.UpdateLocationRequest;
import com.lifedrop.dto.UpdateProfileRequest;
import com.lifedrop.dto.UpdatePushTokenRequest;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserProfileAndDonorControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.lifedrop.repository.NotificationRepository notificationRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User savedDonor;
    private User savedRecipient;
    private String donorToken;
    private String recipientToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();

        savedDonor = userRepository.save(User.builder()
                .name("Karan Donor")
                .email("karan@example.com")
                .password("$2a$10$hashedPass")
                .phone("9876543210")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .age(29)
                .gender("Male")
                .city("Delhi")
                .latitude(28.6139)
                .longitude(77.2090)
                .available(true)
                .active(true)
                .lastDonatedDate(LocalDate.now().minusDays(100))
                .build());
        donorToken = jwtUtil.generateToken(savedDonor.getEmail(), savedDonor.getRole(), savedDonor.getId());

        savedRecipient = userRepository.save(User.builder()
                .name("Meera Recipient")
                .email("meera@example.com")
                .password("$2a$10$hashedPass")
                .phone("9123456780")
                .role(Role.RECIPIENT)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .age(35)
                .city("Delhi")
                .available(false)
                .active(true)
                .build());
        recipientToken = jwtUtil.generateToken(savedRecipient.getEmail(), savedRecipient.getRole(), savedRecipient.getId());
    }

    @Test
    @DisplayName("1. GET /api/users/me returns full profile of authenticated user")
    void testGetFullProfile() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Karan Donor"))
                .andExpect(jsonPath("$.data.email").value("karan@example.com"))
                .andExpect(jsonPath("$.data.phone").value("9876543210"))
                .andExpect(jsonPath("$.data.role").value("DONOR"))
                .andExpect(jsonPath("$.data.bloodGroup").value("O+"))
                .andExpect(jsonPath("$.data.city").value("Delhi"))
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.lastDonatedDate").isNotEmpty());
    }

    @Test
    @DisplayName("2. PUT /api/users/me updates name, phone, city, age, gender without altering email or role")
    void testUpdateProfile() throws Exception {
        UpdateProfileRequest update = UpdateProfileRequest.builder()
                .name("Karan Malhotra")
                .phone("9988776655")
                .city("Gurgaon")
                .age(30)
                .gender("Male")
                .bloodGroup(BloodGroup.O_POSITIVE)
                .build();

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Karan Malhotra"))
                .andExpect(jsonPath("$.data.phone").value("9988776655"))
                .andExpect(jsonPath("$.data.city").value("Gurgaon"))
                .andExpect(jsonPath("$.data.age").value(30))
                .andExpect(jsonPath("$.data.email").value("karan@example.com")) // Unchanged
                .andExpect(jsonPath("$.data.role").value("DONOR")); // Unchanged
    }

    @Test
    @DisplayName("3. PUT /api/users/location updates coordinates; rejects invalid lat/long ranges")
    void testUpdateLocation() throws Exception {
        // Valid location update
        UpdateLocationRequest valid = UpdateLocationRequest.builder()
                .latitude(19.0760)
                .longitude(72.8777)
                .build();

        mockMvc.perform(put("/api/users/location")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(valid)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.latitude").value(19.0760))
                .andExpect(jsonPath("$.data.longitude").value(72.8777));

        // Invalid latitude (> 90)
        UpdateLocationRequest invalidLat = UpdateLocationRequest.builder()
                .latitude(95.0)
                .longitude(72.8777)
                .build();

        mockMvc.perform(put("/api/users/location")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLat)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Invalid longitude (< -180)
        UpdateLocationRequest invalidLng = UpdateLocationRequest.builder()
                .latitude(19.0760)
                .longitude(-190.0)
                .build();

        mockMvc.perform(put("/api/users/location")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLng)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("4. PUT /api/users/push-token updates push token")
    void testUpdatePushToken() throws Exception {
        UpdatePushTokenRequest tokenReq = UpdatePushTokenRequest.builder()
                .pushToken("fcm_device_token_xyz_123456")
                .build();

        mockMvc.perform(put("/api/users/push-token")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tokenReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.pushToken").value("fcm_device_token_xyz_123456"));
    }

    @Test
    @DisplayName("5. GET /api/donor/eligibility returns eligible true when last donation was 100 days ago")
    void testCheckEligibilityEligible() throws Exception {
        mockMvc.perform(get("/api/donor/eligibility")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.eligible").value(true))
                .andExpect(jsonPath("$.data.daysRemaining").value(0));
    }

    @Test
    @DisplayName("6. Ineligible donor (<90 days) turning availability ON receives 400 error with next eligible date; turning OFF succeeds")
    void testIneligibleDonorAvailabilityRule() throws Exception {
        // Set donor lastDonatedDate to 20 days ago (needs 70 more days)
        savedDonor.setLastDonatedDate(LocalDate.now().minusDays(20));
        savedDonor.setAvailable(false);
        userRepository.save(savedDonor);

        // Check eligibility returns false with 70 days remaining
        mockMvc.perform(get("/api/donor/eligibility")
                        .header("Authorization", "Bearer " + donorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(false))
                .andExpect(jsonPath("$.data.daysRemaining").value(70));

        // Attempting to turn availability ON -> 400 Bad Request
        AvailabilityRequest turnOn = AvailabilityRequest.builder().available(true).build();
        mockMvc.perform(put("/api/donor/availability")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(turnOn)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("not eligible to turn availability ON")))
                .andExpect(jsonPath("$.message", containsString("70 days remaining")));

        // Turning availability OFF is always permitted
        AvailabilityRequest turnOff = AvailabilityRequest.builder().available(false).build();
        mockMvc.perform(put("/api/donor/availability")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(turnOff)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.available").value(false));
    }

    @Test
    @DisplayName("7. Recipient calling donor availability or eligibility receives 403 Forbidden")
    void testRecipientForbiddenFromDonorEndpoints() throws Exception {
        mockMvc.perform(get("/api/donor/eligibility")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        AvailabilityRequest turnOn = AvailabilityRequest.builder().available(true).build();
        mockMvc.perform(put("/api/donor/availability")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(turnOn)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
