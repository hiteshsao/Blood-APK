package com.lifedrop.repository;

import com.lifedrop.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {

    /** Active cities ordered for the mobile picker: sortOrder ASC, then name ASC. */
    List<City> findByActiveTrueOrderBySortOrderAscNameAsc();

    boolean existsByNameIgnoreCase(String name);

    /** Public stats: cities currently served. */
    long countByActiveTrue();
}

