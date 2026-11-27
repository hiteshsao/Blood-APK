package com.lifedrop.services.repository;

import com.lifedrop.services.entity.Booking;
import com.lifedrop.services.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Booking> findByProviderIdOrderByCreatedAtDesc(Long providerId);

    long countByCustomerIdAndStatus(Long customerId, BookingStatus status);

    boolean existsByCustomerIdAndProviderIdAndStatus(Long customerId, Long providerId, BookingStatus status);

    boolean existsByCustomerIdAndProviderIdAndStatusIn(Long customerId, Long providerId, Collection<BookingStatus> statuses);

    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, LocalDateTime cutoff);
}
