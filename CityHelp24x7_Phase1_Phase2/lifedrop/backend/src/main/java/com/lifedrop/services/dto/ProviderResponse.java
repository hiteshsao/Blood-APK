package com.lifedrop.services.dto;

import com.lifedrop.services.entity.ServiceProvider;
import com.lifedrop.services.enums.PriceUnit;
import com.lifedrop.services.enums.VerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Provider as seen by others. phone and address are null unless {@code contactVisible} is true
 * (owner, admin, or a customer with an ACCEPTED/COMPLETED booking).
 */
public record ProviderResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String displayName,
        String description,
        Long cityId,
        Integer experienceYears,
        BigDecimal priceFrom,
        PriceUnit priceUnit,
        boolean available,
        VerificationStatus verificationStatus,
        String statusReason,
        double ratingAvg,
        int ratingCount,
        Double distanceKm,
        boolean contactVisible,
        String phone,
        String address,
        Double latitude,
        Double longitude,
        LocalDateTime createdAt
) {
    public static ProviderResponse from(ServiceProvider p, String categoryName, Double distanceKm, boolean contactVisible) {
        return new ProviderResponse(
                p.getId(), p.getCategoryId(), categoryName, p.getDisplayName(), p.getDescription(), p.getCityId(),
                p.getExperienceYears(), p.getPriceFrom(), p.getPriceUnit(), p.isAvailable(),
                p.getVerificationStatus(), contactVisible ? p.getStatusReason() : null,
                p.getRatingAvg(), p.getRatingCount(), distanceKm, contactVisible,
                contactVisible ? p.getPhone() : null,
                contactVisible ? p.getAddress() : null,
                contactVisible ? p.getLatitude() : null,
                contactVisible ? p.getLongitude() : null,
                p.getCreatedAt());
    }
}
