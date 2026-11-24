package com.lifedrop.services.entity;

import com.lifedrop.services.enums.PriceUnit;
import com.lifedrop.services.enums.VerificationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Professional profile attached to a user account (one per user).
 * userId / categoryId / cityId are plain columns (no foreign keys) so modules stay independent.
 * phone and address are private: they are only shown to a customer after a booking is ACCEPTED.
 */
@Entity
@Table(name = "service_providers", indexes = {
        @Index(name = "idx_providers_cat_city_status", columnList = "category_id, city_id, verification_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class ServiceProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(length = 1000)
    private String description;

    @Column(name = "city_id", nullable = false)
    private Long cityId;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String phone;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "price_from", precision = 10, scale = 2)
    private BigDecimal priceFrom;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_unit")
    private PriceUnit priceUnit;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    @Column(nullable = false)
    private boolean available = true;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "status_reason", length = 500)
    private String statusReason;

    @Builder.Default
    @Column(name = "rating_avg", nullable = false)
    private double ratingAvg = 0.0;

    @Builder.Default
    @Column(name = "rating_count", nullable = false)
    private int ratingCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (verificationStatus == null) {
            verificationStatus = VerificationStatus.PENDING;
        }
    }
}
