package com.lifedrop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
 * Entity tracking user reports on suspicious, fake, or fraudulent blood donation requests.
 * Enforces a unique constraint so a user cannot report the same request twice.
 */
@Entity
@Table(
    name = "reports",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_report_user_request", columnNames = {"reporter_id", "request_id"})
    },
    indexes = {
        @Index(name = "idx_reports_request_id", columnList = "request_id"),
        @Index(name = "idx_reports_reporter_id", columnList = "reporter_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"reporter", "request"})
@EqualsAndHashCode(of = "id")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private BloodRequest request;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
