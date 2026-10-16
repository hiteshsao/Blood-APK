package com.lifedrop.service;

import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.Notification;
import com.lifedrop.entity.User;
import com.lifedrop.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Logging and in-app database persistence implementation of NotificationService.
 * Real push notification dispatch (FCM) integrates seamlessly here.
 */
@Service
public class LoggingNotificationService implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(LoggingNotificationService.class);

    private final NotificationRepository notificationRepository;

    public LoggingNotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional
    public void notifyDonorsOfNewRequest(BloodRequest request, List<User> donors) {
        if (donors == null || donors.isEmpty()) {
            log.info("No nearby compatible donors found to notify for request #{}", request.getId());
            return;
        }

        log.info("📢 [NOTIFICATION] Dispatching new blood request alert #{} ({}) to {} nearby donor(s)",
                request.getId(), request.getBloodGroup().getLabel(), donors.size());

        List<Notification> notifications = new ArrayList<>();
        String title = String.format("Urgent: %s Blood Needed Nearby!", request.getBloodGroup().getLabel());
        String body = String.format("A patient in %s needs %d unit(s) of %s blood. Tap to respond.",
                request.getCity() != null ? request.getCity() : "your area",
                request.getUnitsNeeded(),
                request.getBloodGroup().getLabel());

        for (User donor : donors) {
            log.info("  -> Alert sent to donor id={}, name='{}', pushToken='{}'",
                    donor.getId(), donor.getName(), donor.getPushToken());

            notifications.add(Notification.builder()
                    .user(donor)
                    .title(title)
                    .body(body)
                    .type("NEW_REQUEST")
                    .relatedRequestId(request.getId())
                    .read(false)
                    .build());
        }

        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void notifyRecipientDonorAccepted(BloodRequest request, User donor) {
        log.info("📢 [NOTIFICATION] Donor #{} ('{}') accepted request #{}. Recipient #{} notified.",
                donor.getId(), donor.getName(), request.getId(), request.getRecipient().getId());

        Notification notification = Notification.builder()
                .user(request.getRecipient())
                .title("Donor Accepted Your Request!")
                .body(String.format("%s has accepted your request for %s blood. You can now contact them directly.",
                        donor.getName(), request.getBloodGroup().getLabel()))
                .type("REQUEST_ACCEPTED")
                .relatedRequestId(request.getId())
                .read(false)
                .build();

        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void notifyRequestCompleted(BloodRequest request, User donor) {
        log.info("📢 [NOTIFICATION] Blood request #{} marked COMPLETED. Donor: {}, Recipient: {}",
                request.getId(), donor != null ? donor.getId() : "none", request.getRecipient().getId());

        if (donor != null) {
            Notification notification = Notification.builder()
                    .user(donor)
                    .title("Donation Completed — Thank You!")
                    .body(String.format("Your blood donation for request #%d has been confirmed. You saved a life today!",
                            request.getId()))
                    .type("REQUEST_COMPLETED")
                    .relatedRequestId(request.getId())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }
    }
}
