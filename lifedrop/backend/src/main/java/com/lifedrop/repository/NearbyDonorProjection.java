package com.lifedrop.repository;

import java.time.LocalDate;

/**
 * Spring Data JPA projection for nearby donor search results with distance in km.
 */
public interface NearbyDonorProjection {

    Long getId();

    String getName();

    String getBloodGroup();

    String getCity();

    LocalDate getLastDonatedDate();

    Double getDistance();
}
