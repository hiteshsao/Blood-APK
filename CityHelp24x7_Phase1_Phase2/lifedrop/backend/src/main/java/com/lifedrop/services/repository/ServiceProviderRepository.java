package com.lifedrop.services.repository;

import com.lifedrop.services.entity.ServiceProvider;
import com.lifedrop.services.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long> {
    Optional<ServiceProvider> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<ServiceProvider> findByVerificationStatus(VerificationStatus status);

    List<ServiceProvider> findAllByOrderByCreatedAtDesc();
}
