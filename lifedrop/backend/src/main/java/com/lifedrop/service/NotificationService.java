package com.lifedrop.service;

import com.lifedrop.dto.NotificationResponseDto;
import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for dispatching notifications (in-app and Expo push)
 * and managing user in-app notifications.
 */
public interface NotificationService {

    /**
     * Notifies matched nearby donors about a new incoming blood donation request ("A+ blood needed near you").
     */
    void notifyDonorsOfNewRequest(BloodRequest request, List<User> donors);

    /**
     * Notifies the recipient when a donor accepts their blood request ("A donor accepted your request").
     */
    void notifyRecipientDonorAccepted(BloodRequest request, User donor);

    /**
     * Notifies donors who were still PENDING when a blood request is cancelled ("Blood request cancelled").
     */
    void notifyRequestCancelled(BloodRequest request, List<User> pendingDonors);

    /**
     * Notifies the donor when a blood request is completed ("Thank you for saving a life").
     */
    void notifyRequestCompleted(BloodRequest request, User donor);

    /**
     * Retrieves paged in-app notifications for the user, ordered newest first.
     */
    Page<NotificationResponseDto> getUserNotifications(Long userId, Pageable pageable);

    /**
     * Returns count of unread notifications for the user.
     */
    long getUnreadCount(Long userId);

    /**
     * Marks a specific notification as read.
     */
    NotificationResponseDto markAsRead(Long userId, Long notificationId);

    /**
     * Marks all unread notifications for the user as read.
     */
    int markAllAsRead(Long userId);
}
