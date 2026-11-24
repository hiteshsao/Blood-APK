package com.lifedrop.repository;

import com.lifedrop.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository for EmailOtp persistence and rate/security lookups.
 */
@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    /**
     * Find the latest non-consumed OTP for an email address.
     */
    Optional<EmailOtp> findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(String email);

    /**
     * Count OTPs created for an email since a given timestamp (for hourly cap enforcement).
     */
    long countByEmailAndCreatedAtAfter(String email, Instant after);

    /**
     * Invalidate (consume) all active/unconsumed OTPs for an email before issuing a new one.
     */
    @Modifying
    @Query("UPDATE EmailOtp o SET o.consumed = true WHERE o.email = :email AND o.consumed = false")
    int invalidateActiveOtpsForEmail(@Param("email") String email);

    /**
     * Delete OTP rows older than the specified timestamp (for scheduled cleanup).
     */
    @Modifying
    @Query("DELETE FROM EmailOtp o WHERE o.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") Instant cutoff);
}
