package com.lifedrop.services.repository;

import com.lifedrop.services.entity.ServiceReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceReportRepository extends JpaRepository<ServiceReport, Long> {
    boolean existsByProviderIdAndReporterId(Long providerId, Long reporterId);

    long countByProviderId(Long providerId);
}
