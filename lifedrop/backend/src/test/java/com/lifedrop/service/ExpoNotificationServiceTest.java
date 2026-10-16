package com.lifedrop.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.NotificationResponseDto;
import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.Notification;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.Role;
import com.lifedrop.enums.Urgency;
import com.lifedrop.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@ExtendWith(MockitoExtension.class)
class ExpoNotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private RestClient restClient;
    private MockRestServiceServer mockServer;
    private ObjectMapper objectMapper;
    private ExpoNotificationService notificationService;

    private User recipient;
    private User donorWithToken;
    private User donorWithoutToken;
    private BloodRequest urgentRequest;
    private BloodRequest normalRequest;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        restClient = builder.build();
        objectMapper = new ObjectMapper();

        notificationService = new ExpoNotificationService(
                notificationRepository,
                restClient,
                objectMapper,
                ExpoNotificationService.EXPO_PUSH_URL
        );

        recipient = User.builder()
                .id(1L)
                .name("Ramesh Recipient")
                .email("ramesh@example.com")
                .role(Role.RECIPIENT)
                .phone("9811122233")
                .pushToken("ExponentPushToken[recipient-token-123]")
                .build();

        donorWithToken = User.builder()
                .id(2L)
                .name("Suresh Donor")
                .email("suresh@example.com")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .phone("9822233344")
                .pushToken("ExponentPushToken[donor-token-456]")
                .build();

        donorWithoutToken = User.builder()
                .id(3L)
                .name("Mahesh Donor")
                .email("mahesh@example.com")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.A_POSITIVE)
                .phone("9833344455")
                .pushToken(null) // No push token
                .build();

        urgentRequest = BloodRequest.builder()
                .id(101L)
                .recipient(recipient)
                .patientName("Aarav")
                .bloodGroup(BloodGroup.A_POSITIVE)
                .unitsNeeded(2)
                .urgency(Urgency.URGENT)
                .city("Delhi")
                .status(RequestStatus.PENDING)
                .build();

        normalRequest = BloodRequest.builder()
                .id(102L)
                .recipient(recipient)
                .patientName("Priya")
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .unitsNeeded(1)
                .urgency(Urgency.NORMAL)
                .city("Delhi")
                .status(RequestStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("1. New URGENT request: saves in-app row for all donors, sends push with priority high & channelId urgent to donors with token")
    void testNotifyDonorsOfNewUrgentRequest() {
        mockServer.expect(requestTo(ExpoNotificationService.EXPO_PUSH_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.to").value("ExponentPushToken[donor-token-456]"))
                .andExpect(jsonPath("$.title").value("A+ blood needed near you"))
                .andExpect(jsonPath("$.sound").value("default"))
                .andExpect(jsonPath("$.priority").value("high"))
                .andExpect(jsonPath("$.channelId").value("urgent"))
                .andExpect(jsonPath("$.data.requestId").value(101))
                .andExpect(jsonPath("$.data.type").value("NEW_REQUEST"))
                .andRespond(withSuccess("{\"data\":{\"status\":\"ok\"}}", MediaType.APPLICATION_JSON));

        notificationService.notifyDonorsOfNewRequest(urgentRequest, List.of(donorWithToken, donorWithoutToken));

        // Verifies in-app notifications were saved for BOTH donors (even the one without pushToken)
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository, times(1)).saveAll(captor.capture());
        List<Notification> saved = captor.getValue();
        assertEquals(2, saved.size());
        assertEquals("NEW_REQUEST", saved.get(0).getType());

        // Verifies mock server received exactly 1 push notification (only for donorWithToken)
        mockServer.verify();
    }

    @Test
    @DisplayName("2. New NORMAL request: sends push with priority default and no channelId")
    void testNotifyDonorsOfNewNormalRequest() {
        mockServer.expect(requestTo(ExpoNotificationService.EXPO_PUSH_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.to").value("ExponentPushToken[donor-token-456]"))
                .andExpect(jsonPath("$.title").value("O- blood needed near you"))
                .andExpect(jsonPath("$.priority").value("default"))
                .andExpect(jsonPath("$.channelId").doesNotExist())
                .andExpect(jsonPath("$.data.requestId").value(102))
                .andRespond(withSuccess("{\"data\":{\"status\":\"ok\"}}", MediaType.APPLICATION_JSON));

        notificationService.notifyDonorsOfNewRequest(normalRequest, List.of(donorWithToken));

        verify(notificationRepository, times(1)).saveAll(anyList());
        mockServer.verify();
    }

    @Test
    @DisplayName("3. Donor accepts request: recipient receives in-app row and push notification")
    void testNotifyRecipientDonorAccepted() {
        mockServer.expect(requestTo(ExpoNotificationService.EXPO_PUSH_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.to").value("ExponentPushToken[recipient-token-123]"))
                .andExpect(jsonPath("$.title").value("A donor accepted your request"))
                .andExpect(jsonPath("$.data.requestId").value(101))
                .andExpect(jsonPath("$.data.type").value("REQUEST_ACCEPTED"))
                .andRespond(withSuccess("{\"data\":{\"status\":\"ok\"}}", MediaType.APPLICATION_JSON));

        notificationService.notifyRecipientDonorAccepted(urgentRequest, donorWithToken);

        verify(notificationRepository, times(1)).save(any(Notification.class));
        mockServer.verify();
    }

    @Test
    @DisplayName("4. Request cancelled: pending donors receive in-app row and push notification")
    void testNotifyRequestCancelled() {
        mockServer.expect(requestTo(ExpoNotificationService.EXPO_PUSH_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.to").value("ExponentPushToken[donor-token-456]"))
                .andExpect(jsonPath("$.title").value("Blood request cancelled"))
                .andExpect(jsonPath("$.data.requestId").value(101))
                .andExpect(jsonPath("$.data.type").value("REQUEST_CANCELLED"))
                .andRespond(withSuccess("{\"data\":{\"status\":\"ok\"}}", MediaType.APPLICATION_JSON));

        notificationService.notifyRequestCancelled(urgentRequest, List.of(donorWithToken));

        verify(notificationRepository, times(1)).saveAll(anyList());
        mockServer.verify();
    }

    @Test
    @DisplayName("5. Request completed: accepted donor receives in-app row and push notification")
    void testNotifyRequestCompleted() {
        mockServer.expect(requestTo(ExpoNotificationService.EXPO_PUSH_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.to").value("ExponentPushToken[donor-token-456]"))
                .andExpect(jsonPath("$.title").value("Thank you for saving a life"))
                .andExpect(jsonPath("$.data.requestId").value(101))
                .andExpect(jsonPath("$.data.type").value("REQUEST_COMPLETED"))
                .andRespond(withSuccess("{\"data\":{\"status\":\"ok\"}}", MediaType.APPLICATION_JSON));

        notificationService.notifyRequestCompleted(urgentRequest, donorWithToken);

        verify(notificationRepository, times(1)).save(any(Notification.class));
        mockServer.verify();
    }

    @Test
    @DisplayName("6. Push failure does not fail the main operation: logs error and continues")
    void testPushErrorDoesNotThrowOrAbort() {
        // Expo server returns 500 Internal Server Error
        mockServer.expect(requestTo(ExpoNotificationService.EXPO_PUSH_URL))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        // Must not throw an exception!
        assertDoesNotThrow(() ->
                notificationService.notifyRecipientDonorAccepted(urgentRequest, donorWithToken)
        );

        // In-app notification must still be saved
        verify(notificationRepository, times(1)).save(any(Notification.class));
        mockServer.verify();
    }

    @Test
    @DisplayName("7. In-app notification management: query, unread-count, mark-as-read, and mark-all-read")
    void testInAppNotificationManagement() {
        Notification notif = Notification.builder()
                .id(50L)
                .user(recipient)
                .title("Test Title")
                .body("Test Body")
                .type("TEST")
                .read(false)
                .build();

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(any(), any()))
                .thenReturn(new PageImpl<>(List.of(notif)));
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(3L);
        when(notificationRepository.findById(50L)).thenReturn(Optional.of(notif));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));
        when(notificationRepository.markAllAsReadForUser(1L)).thenReturn(3);

        // Get user notifications
        Page<NotificationResponseDto> page = notificationService.getUserNotifications(1L, PageRequest.of(0, 10));
        assertEquals(1, page.getTotalElements());

        // Unread count
        assertEquals(3L, notificationService.getUnreadCount(1L));

        // Mark as read
        NotificationResponseDto updated = notificationService.markAsRead(1L, 50L);
        assertTrue(updated.isRead());

        // Mark all as read
        assertEquals(3, notificationService.markAllAsRead(1L));
    }
}
