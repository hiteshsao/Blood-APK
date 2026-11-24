package com.lifedrop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.config.AdminBootstrapRunner;
import com.lifedrop.dto.RegisterRequest;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.BloodRequestRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminBootstrapIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AdminBootstrapRunner adminBootstrapRunner;
    @Autowired private UserRepository userRepository;
    @Autowired private BloodRequestRepository bloodRequestRepository;
    @Autowired private RequestResponseRepository requestResponseRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ReportRepository reportRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Registering with role ADMIN is rejected with 400")
    void register_withAdminRole_isRejected() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .name("Sneaky Admin")
                .email("sneaky.admin@lifedrop.test")
                .password("Password@123")
                .phone("9811200001")
                .role(Role.ADMIN)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());

        assertFalse(userRepository.existsByEmail("sneaky.admin@lifedrop.test"));
    }

    @Test
    @DisplayName("Bootstrap promotes an existing user to ADMIN and reports false for an unknown email")
    void bootstrap_promotesExistingUser() {
        userRepository.save(User.builder().name("Owner").email("owner@lifedrop.test")
                .password(passwordEncoder.encode("Password@123")).phone("9811200002")
                .role(Role.USER).active(true).build());

        assertTrue(adminBootstrapRunner.promote("  Owner@LifeDrop.test "));
        assertEquals(Role.ADMIN, userRepository.findByEmail("owner@lifedrop.test").orElseThrow().getRole());

        assertFalse(adminBootstrapRunner.promote("nobody@lifedrop.test"));
    }
}
