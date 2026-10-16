package com.lifedrop.repository;

import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.RequestResponse;
import com.lifedrop.entity.User;
import com.lifedrop.enums.ResponseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestResponseRepository extends JpaRepository<RequestResponse, Long> {

    Optional<RequestResponse> findByRequestAndDonor(BloodRequest request, User donor);

    Optional<RequestResponse> findByRequestIdAndDonorId(Long requestId, Long donorId);

    boolean existsByRequestIdAndDonorId(Long requestId, Long donorId);

    List<RequestResponse> findByDonor(User donor);

    List<RequestResponse> findByDonorAndStatus(User donor, ResponseStatus status);

    List<RequestResponse> findByDonorIdOrderByRespondedAtDesc(Long donorId);

    List<RequestResponse> findByDonorIdAndStatusOrderByRespondedAtDesc(Long donorId, ResponseStatus status);

    List<RequestResponse> findByDonorIdAndStatusOrderByCreatedAtDesc(Long donorId, ResponseStatus status);

    List<RequestResponse> findByRequest(BloodRequest request);

    List<RequestResponse> findByRequestId(Long requestId);

    List<RequestResponse> findByRequestIdAndStatus(Long requestId, ResponseStatus status);

    long countByRequestId(Long requestId);

    long countByRequestIdAndStatus(Long requestId, ResponseStatus status);
}
