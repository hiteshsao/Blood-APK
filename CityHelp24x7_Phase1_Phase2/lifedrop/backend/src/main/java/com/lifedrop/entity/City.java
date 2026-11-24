package com.lifedrop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A supported city in the City Help 24x7 platform.
 * Active cities are shown in the mobile picker; inactive cities remain usable by existing data.
 * sortOrder controls display order (lower value = higher up); ties broken alphabetically by name.
 */
@Entity
@Table(name = "cities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String state;

    private Double latitude;

    private Double longitude;

    /** When false the city is hidden from the picker but still referenced by existing records. */
    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * Display order. Lower = shown first. Ties broken alphabetically by name in the query.
     */
    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 100;
}

