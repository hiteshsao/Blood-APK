package com.lifedrop.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.dto.ExpoPushMessageDto;
import com.lifedrop.dto.NotificationResponseDto;
import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.Notification;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Urgency;
import com.lifedrop.exception.ForbiddenException;
import com.lifedrop.exception.ResourceNotFoundException;
import com.lifedrop.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Real notification service implementing Expo Push API and persistent in-app notifications.
 * - Always saves an in-app Notification row for target users.
 * - Dispatches Expo push notifications via RestClient when user has a pushToken.
 * - Never fails the main operation if a push notification error occurs.
 */
@Slf4j
@Service
public class ExpoNotificationService implements NotificationService {

    public static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final NotificationRepository notificationRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String expoPushEndpoint;

    public ExpoNotificationService(
            NotificationRepository notificationRepository,
            RestClient restClient,
            ObjectMapper objectMapper,
            @Value("${expo.push.url:" + EXPO_PUSH_URL + "}") String expoPushEndpoint
    ) {
        this.notificationRepository = notificationRepository;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.expoPushEndpoint = expoPushEndpoint;
    }

    // ==========================================
    // NOTIFICATION DISPATCH METHODS
    // ==========================================

    @Override
    @Transactional
    public void notifyDonorsOfNewRequest(BloodRequest request, List<User> donors) {
        if (donors == null || donors.isEmpty()) {
            log.info("No nearby compatible donors found to notify for request #{}", request.getId());
            return;
        }

        String bloodGroupLabel = request.getBloodGroup() != null ? request.getBloodGroup().getLabel() : "";
        String title = String.format("%s blood needed near you", bloodGroupLabel);
        String body = String.format("A patient in %s needs %d unit(s) of %s blood.",
                request.getCity() != null ? request.getCity() : "your area",
                request.getUnitsNeeded(),
                bloodGroupLabel);
        boolean isUrgent = request.getUrgency() == Urgency.URGENT;

        log.info("📢 [NOTIFICATION] Dispatching new blood request alert #{} ({}) to {} nearby donor(s)",
                request.getId(), bloodGroupLabel, donors.size());

        List<Notification> inAppList = new ArrayList<>();
        for (User donor : donors) {
            inAppList.add(Notification.builder()
                    .user(donor)
                    .title(title)
                    .body(body)
                    .type("NEW_REQUEST")
                    .relatedRequestId(request.getId())
                    .read(false)
                    .build());
        }
        notificationRepository.saveAll(inAppList);

        // Send push notifications to donors who have a registered pushToken
        for (User donor : donors) {
            if (hasPushToken(donor)) {
                sendPushNotification(
                        donor.getPushToken(),
                        title,
                        body,
                        request.getId(),
                        "NEW_REQUEST",
                        isUrgent
                );
            }
        }
    }

    @Override
    @Transactional
    public void notifyRecipientDonorAccepted(BloodRequest request, User donor) {
        User recipient = request.getRecipient();
        String bloodGroupLabel = request.getBloodGroup() != null ? request.getBloodGroup().getLabel() : "";
        String title = "A donor accepted your request";
        String body = String.format("%s has accepted your request for %s blood. Tap to view contact details.",
                donor.getName(), bloodGroupLabel);
        boolean isUrgent = request.getUrgency() == Urgency.URGENT;

        // In-app notification
        Notification inApp = Notification.builder()
                .user(recipient)
                .title(title)
                .body(body)
                .type("REQUEST_ACCEPTED")
                .relatedRequestId(request.getId())
                .read(false)
                .build();
        notificationRepository.save(inApp);

        // Push notification
        if (hasPushToken(recipient)) {
            sendPushNotification(
                    recipient.getPushToken(),
                    title,
                    body,
                    request.getId(),
                    "REQUEST_ACCEPTED",
                    isUrgent
            );
        }
    }

    @Override
    @Transactional
    public void notifyRequestCancelled(BloodRequest request, List<User> pendingDonors) {
        if (pendingDonors == null || pendingDonors.isEmpty()) {
            return;
        }

        String bloodGroupLabel = request.getBloodGroup() != null ? request.getBloodGroup().getLabel() : "";
        String title = "Blood request cancelled";
        String body = String.format("The request for %s blood in %s has been cancelled by the recipient.",
                bloodGroupLabel,
                request.getCity() != null ? request.getCity() : "your area");

        List<Notification> inAppList = new ArrayList<>();
        for (User donor : pendingDonors) {
            inAppList.add(Notification.builder()
                    .user(donor)
                    .title(title)
                    .body(body)
                    .type("REQUEST_CANCELLED")
                    .relatedRequestId(request.getId())
                    .read(false)
                    .build());
        }
        notificationRepository.saveAll(inAppList);

        for (User donor : pendingDonors) {
            if (hasPushToken(donor)) {
                sendPushNotification(
                        donor.getPushToken(),
                        title,
                        body,
                        request.getId(),
                        "REQUEST_CANCELLED",
                        false
                );
            }
        }
    }

    @Override
    @Transactional
    public void notifyRequestCompleted(BloodRequest request, User donor) {
        if (donor == null) {
            return;
        }

        String title = "Thank you for saving a life";
        String body = String.format("Your blood donation for request #%d has been confirmed as completed. Thank you for your generosity!",
                request.getId());

        Notification inApp = Notification.builder()
                .user(donor)
                .title(title)
                .body(body)
                .type("REQUEST_COMPLETED")
                .relatedRequestId(request.getId())
                .read(false)
                .build();
        notificationRepository.save(inApp);

        if (hasPushToken(donor)) {
            sendPushNotification(
                    donor.getPushToken(),
                    title,
                    body,
                    request.getId(),
                    "REQUEST_COMPLETED",
                    false
            );
        }
    }

    // ==========================================
    // IN-APP NOTIFICATION QUERY & READ METHODS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getUserNotifications(Long userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(NotificationResponseDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationResponseDto markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You cannot access another user's notifications");
        }

        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return NotificationResponseDto.fromEntity(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadForUser(userId);
    }

    // ==========================================
    // EXPO PUSH DISPATCH HELPER
    // ==========================================

    /**
     * Dispatches push notification to Expo Push API.
     * Safely catches any error so the main database transaction never fails.
     */
    public void sendPushNotification(
            String pushToken,
            String title,
            String body,
            Long requestId,
            String type,
            boolean isUrgent
    ) {
        try {
            Map<String, Object> data = new HashMap<>();
            if (requestId != null) {
                data.put("requestId", requestId);
            }
            if (type != null) {
                data.put("type", type);
            }

            ExpoPushMessageDto message = ExpoPushMessageDto.builder()
                    .to(pushToken.trim())
                    .title(title)
                    .body(body)
                    .sound("default")
                    .data(data)
                    .priority(isUrgent ? "high" : "default")
                    .channelId(isUrgent ? "urgent" : null)
                    .build();

            // Log outgoing payload as required by acceptance criteria
            String payloadJson = objectMapper.writeValueAsString(message);
            log.info("📢 [EXPO PUSH] Sending outgoing payload to [{}]: {}", pushToken, payloadJson);

            restClient.post()
                    .uri(expoPushEndpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(message)
                    .retrieve()
                    .toBodilessEntity();

            log.info("✅ [EXPO PUSH] Push notification successfully delivered to [{}]", pushToken);
        } catch (Exception ex) {
            log.error("⚠️ [EXPO PUSH] Failed to send push notification to token '{}': {}", pushToken, ex.getMessage());
            // Intentionally suppress: Never fail the main request because of a push error
        }
    }

    private boolean hasPushToken(User user) {
        return user != null && user.getPushToken() != null && !user.getPushToken().trim().isEmpty();
    }
}
