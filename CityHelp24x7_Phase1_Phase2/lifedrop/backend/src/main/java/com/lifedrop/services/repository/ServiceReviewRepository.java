package com.lifedrop.services.repository;

import com.lifedrop.services.entity.ServiceReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceReviewRepository extends JpaRepository<ServiceReview, Long> {
    List<ServiceReview> findByProviderIdOrderByCreatedAtDesc(Long providerId);

    Optional<ServiceReview> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);
}
