package com.lifedrop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.entity.Notification;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.NotificationRepository;
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

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationControllerIntegrationTest {

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
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User user1;
    private User user2;
    private String user1Token;
    private String user2Token;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();

        user1 = userRepository.save(User.builder()
                .name("Arun Kumar")
                .email("arun@example.com")
                .password("$2a$10$hashedPass")
                .phone("9811122233")
                .role(Role.DONOR)
                .pushToken("ExponentPushToken[token1]")
                .available(true)
                .active(true)
                .build());
        user1Token = jwtUtil.generateToken(user1.getEmail(), user1.getRole(), user1.getId());

        user2 = userRepository.save(User.builder()
                .name("Varun Sharma")
                .email("varun@example.com")
                .password("$2a$10$hashedPass")
                .phone("9822233344")
                .role(Role.RECIPIENT)
                .available(false)
                .active(true)
                .build());
        user2Token = jwtUtil.generateToken(user2.getEmail(), user2.getRole(), user2.getId());

        // Create 3 notifications for user1 (2 unread, 1 read)
        notificationRepository.save(Notification.builder()
                .user(user1)
                .title("A+ blood needed near you")
                .body("Patient in Delhi needs 2 units")
                .type("NEW_REQUEST")
                .relatedRequestId(10L)
                .read(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(user1)
                .title("Blood request cancelled")
                .body("Request #9 was cancelled")
                .type("REQUEST_CANCELLED")
                .relatedRequestId(9L)
                .read(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(user1)
                .title("Welcome to LifeDrop")
                .body("Your donor profile is active")
                .type("GENERAL")
                .read(true)
                .build());

        // Create 1 notification for user2
        notificationRepository.save(Notification.builder()
                .user(user2)
                .title("A donor accepted your request")
                .body("Tap to contact donor")
                .type("REQUEST_ACCEPTED")
                .relatedRequestId(11L)
                .read(false)
                .build());
    }

    @Test
    @DisplayName("1. GET /api/notifications returns paged notifications for authenticated user")
    void testGetNotifications() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + user1Token)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(3)))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.content[0].title").isString());
    }

    @Test
    @DisplayName("2. GET /api/notifications/unread-count returns correct unread count")
    void testGetUnreadCount() throws Exception {
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.unreadCount").value(2));
    }

    @Test
    @DisplayName("3. PUT /api/notifications/{id}/read marks a notification as read")
    void testMarkAsRead() throws Exception {
        Notification unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user1.getId()).get(0);

        mockMvc.perform(put("/api/notifications/" + unread.getId() + "/read")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(unread.getId()))
                .andExpect(jsonPath("$.data.read").value(true));

        Notification refreshed = notificationRepository.findById(unread.getId()).orElseThrow();
        assertTrue(refreshed.isRead());
    }

    @Test
    @DisplayName("4. User cannot mark another user's notification as read (403 Forbidden)")
    void testMarkOtherUserNotificationAsReadForbidden() throws Exception {
        Notification user2Notif = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(user2.getId()).get(0);

        mockMvc.perform(put("/api/notifications/" + user2Notif.getId() + "/read")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("5. PUT /api/notifications/read-all marks all notifications for user as read")
    void testMarkAllAsRead() throws Exception {
        assertEquals(2, notificationRepository.countByUserIdAndReadFalse(user1.getId()));

        mockMvc.perform(put("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.markedCount").value(2));

        assertEquals(0, notificationRepository.countByUserIdAndReadFalse(user1.getId()));
        // User 2's unread notifications must remain untouched
        assertEquals(1, notificationRepository.countByUserIdAndReadFalse(user2.getId()));
    }
}
