package com.lifedrop.services.service;

import com.lifedrop.entity.Notification;
import com.lifedrop.entity.User;
import com.lifedrop.repository.NotificationRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.service.ExpoNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Creates in-app notifications (and best-effort push) for the services module.
 * relatedRequestId carries the booking id for BOOKING_* types, or the provider id for PROVIDER_* types.
 * Never throws: a failed notification must not break a booking or an admin decision.
 */
@Slf4j
@Component
public class ServiceNotifier {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ExpoNotificationService pushService;

    public ServiceNotifier(NotificationRepository notificationRepository,
                           UserRepository userRepository,
                           ExpoNotificationService pushService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.pushService = pushService;
    }

    public void notify(Long userId, String type, String title, String body, Long relatedId) {
        if (userId == null) {
            return;
        }
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return;
            }
            notificationRepository.save(Notification.builder()
                    .user(user).title(title).body(body).type(type).relatedRequestId(relatedId).read(false).build());
            if (user.getPushToken() != null && !user.getPushToken().isBlank()) {
                pushService.sendPushNotification(user.getPushToken(), title, body, relatedId, type, false);
            }
        } catch (Exception ex) {
            log.warn("Could not send service notification {} to user {}: {}", type, userId, ex.getMessage());
        }
    }
}
