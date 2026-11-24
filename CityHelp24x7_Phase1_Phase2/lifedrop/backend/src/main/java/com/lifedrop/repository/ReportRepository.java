package com.lifedrop.repository;

import com.lifedrop.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByRequestIdAndReporterId(Long requestId, Long reporterId);

    long countByRequestId(Long requestId);

    List<Report> findByRequestId(Long requestId);
}
