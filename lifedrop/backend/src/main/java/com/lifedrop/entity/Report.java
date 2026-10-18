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
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

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

    public Report() {
    }

    public Report(Long id, User reporter, BloodRequest request, String reason, LocalDateTime createdAt) {
        this.id = id;
        this.reporter = reporter;
        this.request = request;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static ReportBuilder builder() {
        return new ReportBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getReporter() {
        return reporter;
    }

    public void setReporter(User reporter) {
        this.reporter = reporter;
    }

    public BloodRequest getRequest() {
        return request;
    }

    public void setRequest(BloodRequest request) {
        this.request = request;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Report report = (Report) o;
        return Objects.equals(id, report.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return "Report{" +
                "id=" + id +
                ", reason='" + reason + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    public static class ReportBuilder {
        private Long id;
        private User reporter;
        private BloodRequest request;
        private String reason;
        private LocalDateTime createdAt;

        ReportBuilder() {
        }

        public ReportBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ReportBuilder reporter(User reporter) {
            this.reporter = reporter;
            return this;
        }

        public ReportBuilder request(BloodRequest request) {
            this.request = request;
            return this;
        }

        public ReportBuilder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public ReportBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Report build() {
            return new Report(id, reporter, request, reason, createdAt);
        }
    }
}
