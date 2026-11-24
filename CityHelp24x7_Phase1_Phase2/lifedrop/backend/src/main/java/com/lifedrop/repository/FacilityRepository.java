package com.lifedrop.repository;

import com.lifedrop.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    /** All active entries. The directory is small (hundreds per city), so filtering and distance are done in the service. */
    List<Facility> findByActiveTrue();
}
