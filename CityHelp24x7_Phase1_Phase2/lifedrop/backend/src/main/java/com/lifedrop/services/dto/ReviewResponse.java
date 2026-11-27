package com.lifedrop.services.dto;

import com.lifedrop.services.entity.ServiceReview;

import java.time.LocalDateTime;

public record ReviewResponse(Long id, int rating, String comment, String customerName, LocalDateTime createdAt) {
    public static ReviewResponse from(ServiceReview r) {
        return new ReviewResponse(r.getId(), r.getRating(), r.getComment(), r.getCustomerName(), r.getCreatedAt());
    }
}
