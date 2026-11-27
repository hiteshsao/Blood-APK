package com.lifedrop.services.repository;

import com.lifedrop.services.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    List<ServiceCategory> findByActiveTrueOrderBySortOrderAscNameAsc();
}
