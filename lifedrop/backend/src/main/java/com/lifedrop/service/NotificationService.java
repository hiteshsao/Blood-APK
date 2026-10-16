package com.lifedrop.service;

import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.User;

import java.util.List;

/**
 * Service interface for dispatching notifications to donors and recipients.
 */
public interface NotificationService {

    /**
     * Notifies matched nearby donors about a new incoming blood donation request.
     */
    void notifyDonorsOfNewRequest(BloodRequest request, List<User> donors);

    /**
     * Notifies the recipient when a donor accepts their blood request.
     */
    void notifyRecipientDonorAccepted(BloodRequest request, User donor);

    /**
     * Notifies the recipient/donor when a blood request is marked as completed.
     */
    void notifyRequestCompleted(BloodRequest request, User donor);
}
