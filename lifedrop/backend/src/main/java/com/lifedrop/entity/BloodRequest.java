package com.lifedrop.entity;

import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.Urgency;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Blood donation request initiated by a recipient.
 */
@Entity
@Table(name = "blood_requests", indexes = {
    @Index(name = "idx_blood_requests_status", columnList = "status"),
    @Index(name = "idx_blood_requests_recipient", columnList = "recipient_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"recipient", "acceptedDonor"})
@EqualsAndHashCode(of = "id")
public class BloodRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group", nullable = false)
    private BloodGroup bloodGroup;

    @Column(name = "units_needed", nullable = false)
    private Integer unitsNeeded;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Urgency urgency;

    private String city;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    @Column(name = "radius_km", nullable = false)
    private Double radiusKm = 10.0;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "required_by")
    private LocalDateTime requiredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_donor_id")
    private User acceptedDonor;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (radiusKm == null) {
            radiusKm = 10.0;
        }
        if (status == null) {
            status = RequestStatus.PENDING;
        }
        if (urgency == null) {
            urgency = Urgency.NORMAL;
        }
    }
}
