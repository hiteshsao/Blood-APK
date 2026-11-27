package com.lifedrop.entity;

import com.lifedrop.enums.FacilityType;
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
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Information-only directory entry (hospital or blood bank).
 * These are NOT user accounts: no logins, no inventory, no middleman.
 * cityId is a plain column (no foreign key) so other modules and tests can clean tables independently.
 */
@Entity
@Table(name = "facilities", indexes = {
    @Index(name = "idx_facilities_type_city_active", columnList = "type, city_id, active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String phone;

    @Column(name = "emergency_phone")
    private String emergencyPhone;

    @Column(name = "city_id")
    private Long cityId;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    @Column(name = "open_24x7", nullable = false)
    private Boolean open24x7 = false;

    @Column(length = 500)
    private String notes;

    @Builder.Default
    @Column(nullable = false)
    private Boolean verified = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (open24x7 == null) {
            open24x7 = false;
        }
        if (verified == null) {
            verified = false;
        }
        if (active == null) {
            active = true;
        }
    }
}
