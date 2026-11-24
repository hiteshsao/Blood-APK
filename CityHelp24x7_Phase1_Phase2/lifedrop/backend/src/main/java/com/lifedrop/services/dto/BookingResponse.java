package com.lifedrop.services.dto;

import com.lifedrop.services.enums.BookingStatus;

import java.time.LocalDateTime;

/**
 * Booking as seen by one party. otherPartyPhone / otherPartyAddress stay null until ACCEPTED (privacy shield).
 * viewerRole is CUSTOMER or PROVIDER.
 */
public record BookingResponse(
        Long id,
        Long providerId,
        String providerName,
        String categoryName,
        String customerName,
        BookingStatus status,
        LocalDateTime scheduledAt,
        String description,
        String providerNote,
        String viewerRole,
        boolean contactVisible,
        String otherPartyPhone,
        String otherPartyAddress,
        boolean reviewed,
        Integer rating,
        LocalDateTime createdAt
) {
}
