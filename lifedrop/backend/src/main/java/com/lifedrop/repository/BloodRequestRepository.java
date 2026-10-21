package com.lifedrop.repository;

import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByRecipient(User recipient);

    List<BloodRequest> findByRecipientOrderByCreatedAtDesc(User recipient);

    List<BloodRequest> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    List<BloodRequest> findByRecipientIdAndUrgencyAndStatusIn(Long recipientId, com.lifedrop.enums.Urgency urgency, Collection<RequestStatus> statuses);

    java.util.Optional<BloodRequest> findFirstByRecipientIdAndUrgencyAndStatusInOrderByCreatedAtDesc(
            Long recipientId, com.lifedrop.enums.Urgency urgency, Collection<RequestStatus> statuses);

    long countByRecipientIdAndCreatedAtAfter(Long recipientId, java.time.LocalDateTime after);

    List<BloodRequest> findByStatus(RequestStatus status);

    List<BloodRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<BloodRequest> findByStatusInOrderByCreatedAtDesc(Collection<RequestStatus> statuses);

    List<BloodRequest> findByBloodGroupAndStatus(BloodGroup bloodGroup, RequestStatus status);

    List<BloodRequest> findByCityIgnoreCaseAndStatus(String city, RequestStatus status);

    List<BloodRequest> findByAcceptedDonor(User donor);

    List<BloodRequest> findByAcceptedDonorIdOrderByCreatedAtDesc(Long donorId);

    List<BloodRequest> findByStatusAndCreatedAtBefore(RequestStatus status, java.time.LocalDateTime before);

    /**
     * Finds active PENDING requests within each request's radiusKm of a donor's location,
     * where the request blood group is in the donor's compatible recipient groups.
     */
    @Query(value = """
        SELECT r.*,
               (6371 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:latitude)) * cos(radians(r.latitude)) *
                   cos(radians(r.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) * sin(radians(r.latitude))
               )))) AS distance
        FROM blood_requests r
        WHERE r.status = 'PENDING'
          AND r.blood_group IN (:bloodGroups)
          AND r.latitude IS NOT NULL
          AND r.longitude IS NOT NULL
          AND (6371 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:latitude)) * cos(radians(r.latitude)) *
                   cos(radians(r.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) * sin(radians(r.latitude))
               )))) <= coalesce(r.radius_km, 10.0)
        ORDER BY r.urgency DESC, distance ASC
        """, nativeQuery = true)
    List<BloodRequest> findNearbyPendingRequests(
        @Param("latitude") double latitude,
        @Param("longitude") double longitude,
        @Param("bloodGroups") Collection<String> bloodGroups
    );
}
