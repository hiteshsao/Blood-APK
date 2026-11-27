package com.lifedrop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * User entity representing either a DONOR or a RECIPIENT.
 * Note: LifeDrop is peer-to-peer; no hospital or blood bank accounts.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_role_blood_available", columnList = "role, blood_group, available")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "password")
@EqualsAndHashCode(of = "id")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group")
    private BloodGroup bloodGroup;

    private Integer age;

    private String gender;

    private String city;

    /** Structured city reference. Nullable — old clients that only set the free-text city field still work. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City cityRef;

    public Long getCityId() {
        return cityRef != null ? cityRef.getId() : null;
    }

    private Double latitude;

    private Double longitude;

    @Builder.Default
    @Column(nullable = false)
    private Boolean available = true;

    @Builder.Default
    @Column(name = "donor_enabled", nullable = false)
    private Boolean donorEnabled = false;

    @Column(name = "last_donated_date")
    private LocalDate lastDonatedDate;

    @Column(name = "push_token")
    private String pushToken;

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
        if (available == null) {
            available = true;
        }
        if (donorEnabled == null) {
            donorEnabled = false;
        }
        if (active == null) {
            active = true;
        }
    }
}
