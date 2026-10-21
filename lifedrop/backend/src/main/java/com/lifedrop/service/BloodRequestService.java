package com.lifedrop.service;

import com.lifedrop.dto.AcceptRequestResponseDto;
import com.lifedrop.dto.BloodRequestRecipientResponseDto;
import com.lifedrop.dto.CreateBloodRequestDto;
import com.lifedrop.dto.DonorIncomingRequestDto;
import com.lifedrop.dto.DonorRequestDetailsDto;
import com.lifedrop.dto.DonorResponseDto;
import com.lifedrop.dto.SosRequestDto;
import com.lifedrop.dto.SosResponseDto;
import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.RequestResponse;
import com.lifedrop.entity.User;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.ResponseStatus;
import com.lifedrop.enums.Urgency;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.exception.ConflictException;
import com.lifedrop.exception.ForbiddenException;
import com.lifedrop.exception.NotFoundException;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.RequestResponseRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.util.DistanceCalculator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service managing the complete blood donation request lifecycle for Recipients and Donors.
 */
@Slf4j
@Service
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final RequestResponseRepository requestResponseRepository;
    private final UserRepository userRepository;
    private final MatchingService matchingService;
    private final NotificationService notificationService;
    private final com.lifedrop.repository.ReportRepository reportRepository;

    public BloodRequestService(
            BloodRequestRepository bloodRequestRepository,
            RequestResponseRepository requestResponseRepository,
            UserRepository userRepository,
            MatchingService matchingService,
            NotificationService notificationService,
            com.lifedrop.repository.ReportRepository reportRepository
    ) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.requestResponseRepository = requestResponseRepository;
        this.userRepository = userRepository;
        this.matchingService = matchingService;
        this.notificationService = notificationService;
        this.reportRepository = reportRepository;
    }

    // ==========================================
    // RECIPIENT OPERATIONS
    // ==========================================

    /**
     * Creates a new blood donation request, matches compatible nearby donors,
     * creates PENDING response records, dispatches notifications, and returns the request details.
     */
    @Transactional
    public BloodRequestRecipientResponseDto createRequest(Long recipientId, CreateBloodRequestDto dto) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new NotFoundException("Recipient not found"));

        // Rate limit: a recipient may create at most 3 requests per 24 hours
        LocalDateTime cutoff24Hours = LocalDateTime.now().minusHours(24);
        long requestsInLast24Hours = bloodRequestRepository.countByRecipientIdAndCreatedAtAfter(recipientId, cutoff24Hours);
        if (requestsInLast24Hours >= 3) {
            throw new com.lifedrop.exception.RateLimitException(
                    "Rate limit exceeded: A recipient may create at most 3 blood donation requests per 24 hours.");
        }

        // Radius resolution: 10 km for NORMAL, 25 km for URGENT unless specified
        double radiusKm;
        if (dto.getRadiusKm() != null && dto.getRadiusKm() > 0) {
            radiusKm = dto.getRadiusKm();
        } else {
            radiusKm = (dto.getUrgency() == Urgency.URGENT) ? 25.0 : 10.0;
        }

        String city = (dto.getCity() != null && !dto.getCity().trim().isEmpty())
                ? dto.getCity().trim()
                : recipient.getCity();

        BloodRequest request = BloodRequest.builder()
                .recipient(recipient)
                .patientName(dto.getPatientName().trim())
                .bloodGroup(dto.getBloodGroup())
                .unitsNeeded(dto.getUnitsNeeded())
                .urgency(dto.getUrgency())
                .city(city)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .radiusKm(radiusKm)
                .message(dto.getMessage())
                .requiredBy(dto.getRequiredBy())
                .status(RequestStatus.PENDING)
                .build();

        request = bloodRequestRepository.save(request);

        // Find compatible nearby donors
        List<DonorResponseDto> matched = matchingService.findCompatibleDonors(
                dto.getBloodGroup(),
                dto.getLatitude(),
                dto.getLongitude(),
                radiusKm
        );

        int matchedCount = 0;
        if (!matched.isEmpty()) {
            List<Long> donorIds = matched.stream().map(DonorResponseDto::getId).toList();
            List<User> donorUsers = userRepository.findAllById(donorIds);

            for (User donorUser : donorUsers) {
                RequestResponse response = RequestResponse.builder()
                        .request(request)
                        .donor(donorUser)
                        .status(ResponseStatus.PENDING)
                        .build();
                requestResponseRepository.save(response);
            }

            matchedCount = donorUsers.size();
            // Dispatch notification to matched donors
            notificationService.notifyDonorsOfNewRequest(request, donorUsers);
        }

        log.info("Created BloodRequest ID: {} for recipient ID: {} with {} matched donors within {} km",
                request.getId(), recipientId, matchedCount, radiusKm);

        return BloodRequestRecipientResponseDto.fromEntity(request, matchedCount);
    }

    /**
     * Broadcasts an emergency SOS blood alert:
     * - Limit: one active SOS per recipient at a time.
     * - Urgency: URGENT, radius: 25 km, requiredBy: now + 6 hours.
     * - If no donors found within 25 km, automatically retries once with 50 km.
     * - Dispatches high-priority push notification on the "urgent" channel to all matched donors.
     * - Returns { requestId, donorsNotified, radiusKm, message }.
     */
    @Transactional
    public SosResponseDto createSosRequest(Long recipientId, SosRequestDto dto) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new NotFoundException("Recipient not found"));

        // Limit: one active SOS per recipient at a time
        List<BloodRequest> activeSosList = bloodRequestRepository.findByRecipientIdAndUrgencyAndStatusIn(
                recipientId,
                Urgency.URGENT,
                List.of(RequestStatus.PENDING, RequestStatus.ACCEPTED)
        );
        if (!activeSosList.isEmpty()) {
            BloodRequest active = activeSosList.get(0);
            throw new BadRequestException(String.format(
                    "You already have an active SOS request in progress (#%d, %s). Please complete or cancel it before dispatching a new SOS.",
                    active.getId(), active.getStatus()
            ));
        }

        String city = (dto.getCity() != null && !dto.getCity().trim().isEmpty())
                ? dto.getCity().trim()
                : (recipient.getCity() != null ? recipient.getCity() : "Nearby Area");

        BloodRequest request = BloodRequest.builder()
                .recipient(recipient)
                .patientName(dto.getPatientName().trim())
                .bloodGroup(dto.getBloodGroup())
                .unitsNeeded(1)
                .urgency(Urgency.URGENT)
                .city(city)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .radiusKm(25.0)
                .message(dto.getMessage() != null && !dto.getMessage().trim().isEmpty()
                        ? dto.getMessage().trim()
                        : "🚨 EMERGENCY SOS: Urgent blood required immediately.")
                .requiredBy(LocalDateTime.now().plusHours(6))
                .status(RequestStatus.PENDING)
                .build();

        // 1. Initial donor search within 25 km
        List<DonorResponseDto> matched = matchingService.findCompatibleDonors(
                dto.getBloodGroup(),
                dto.getLatitude(),
                dto.getLongitude(),
                25.0
        );

        // 2. If no donor is found in 25 km, automatically retry once with 50 km
        if (matched.isEmpty()) {
            log.info("No compatible donors found within 25 km for SOS. Automatically retrying once with 50 km radius...");
            matched = matchingService.findCompatibleDonors(
                    dto.getBloodGroup(),
                    dto.getLatitude(),
                    dto.getLongitude(),
                    50.0
            );
            if (!matched.isEmpty()) {
                request.setRadiusKm(50.0);
            }
        }

        request = bloodRequestRepository.save(request);

        int matchedCount = 0;
        if (!matched.isEmpty()) {
            List<Long> donorIds = matched.stream().map(DonorResponseDto::getId).toList();
            List<User> donorUsers = userRepository.findAllById(donorIds);

            for (User donorUser : donorUsers) {
                RequestResponse response = RequestResponse.builder()
                        .request(request)
                        .donor(donorUser)
                        .status(ResponseStatus.PENDING)
                        .build();
                requestResponseRepository.save(response);
            }

            matchedCount = donorUsers.size();
            // Dispatches high-priority push notification on "urgent" channel
            notificationService.notifyDonorsOfNewRequest(request, donorUsers);
        }

        log.info("🚨 [EMERGENCY SOS] Created BloodRequest #{} for recipient ID: {} with {} matched donors within {} km",
                request.getId(), recipientId, matchedCount, request.getRadiusKm());

        return SosResponseDto.builder()
                .requestId(request.getId())
                .donorsNotified(matchedCount)
                .radiusKm(request.getRadiusKm())
                .status(request.getStatus().name())
                .message(String.format("Emergency SOS broadcasted successfully. %d nearby compatible donors alerted within %.0f km.",
                        matchedCount, request.getRadiusKm()))
                .build();
    }

    /**
     * Retrieves the currently active SOS request for a recipient, if any.
     */
    @Transactional(readOnly = true)
    public BloodRequestRecipientResponseDto getActiveSosRequest(Long recipientId) {
        return bloodRequestRepository.findFirstByRecipientIdAndUrgencyAndStatusInOrderByCreatedAtDesc(
                recipientId,
                Urgency.URGENT,
                List.of(RequestStatus.PENDING, RequestStatus.ACCEPTED)
        ).map(r -> {
            int count = (int) requestResponseRepository.countByRequestId(r.getId());
            return BloodRequestRecipientResponseDto.fromEntity(r, count);
        }).orElse(null);
    }


    /**
     * Returns all blood requests created by the recipient, ordered newest first.
     */
    @Transactional(readOnly = true)
    public List<BloodRequestRecipientResponseDto> getRecipientRequests(Long recipientId) {
        List<BloodRequest> requests = bloodRequestRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        return requests.stream()
                .map(r -> {
                    int count = (int) requestResponseRepository.countByRequestId(r.getId());
                    return BloodRequestRecipientResponseDto.fromEntity(r, count);
                })
                .toList();
    }

    /**
     * Returns details of a specific request owned by the recipient.
     */
    @Transactional(readOnly = true)
    public BloodRequestRecipientResponseDto getRecipientRequestDetails(Long recipientId, Long requestId) {
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Blood request not found with ID: " + requestId));

        if (!request.getRecipient().getId().equals(recipientId)) {
            throw new ForbiddenException("You are not authorized to view this request");
        }

        int count = (int) requestResponseRepository.countByRequestId(requestId);
        return BloodRequestRecipientResponseDto.fromEntity(request, count);
    }

    /**
     * Cancels an active blood request.
     */
    @Transactional
    public BloodRequestRecipientResponseDto cancelRequest(Long recipientId, Long requestId) {
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Blood request not found with ID: " + requestId));

        if (!request.getRecipient().getId().equals(recipientId)) {
            throw new ForbiddenException("You are not authorized to cancel this request");
        }

        if (request.getStatus() == RequestStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel an already COMPLETED request");
        }
        if (request.getStatus() == RequestStatus.CANCELLED) {
            throw new BadRequestException("Request is already CANCELLED");
        }

        request.setStatus(RequestStatus.CANCELLED);
        request = bloodRequestRepository.save(request);

        // Mark remaining pending responses as EXPIRED and notify donors
        List<RequestResponse> pending = requestResponseRepository.findByRequestIdAndStatus(requestId, ResponseStatus.PENDING);
        List<User> pendingDonors = pending.stream().map(RequestResponse::getDonor).toList();

        for (RequestResponse rr : pending) {
            rr.setStatus(ResponseStatus.EXPIRED);
            rr.setRespondedAt(LocalDateTime.now());
        }
        requestResponseRepository.saveAll(pending);

        if (!pendingDonors.isEmpty()) {
            notificationService.notifyRequestCancelled(request, pendingDonors);
        }

        log.info("BloodRequest ID: {} cancelled by recipient ID: {}. {} pending donors notified.",
                requestId, recipientId, pendingDonors.size());
        int count = (int) requestResponseRepository.countByRequestId(requestId);
        return BloodRequestRecipientResponseDto.fromEntity(request, count);
    }

    /**
     * Marks an ACCEPTED blood request as COMPLETED and updates the accepted donor's lastDonatedDate to today.
     */
    @Transactional
    public BloodRequestRecipientResponseDto completeRequest(Long recipientId, Long requestId) {
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Blood request not found with ID: " + requestId));

        if (!request.getRecipient().getId().equals(recipientId)) {
            throw new ForbiddenException("You are not authorized to complete this request");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED) {
            throw new BadRequestException("Only ACCEPTED requests can be marked as COMPLETED. Current status: " + request.getStatus());
        }

        request.setStatus(RequestStatus.COMPLETED);
        request = bloodRequestRepository.save(request);

        User donor = request.getAcceptedDonor();
        if (donor != null) {
            donor.setLastDonatedDate(LocalDate.now());
            userRepository.save(donor);
            notificationService.notifyRequestCompleted(request, donor);
            log.info("Donor ID: {} lastDonatedDate updated to {} upon request completion", donor.getId(), LocalDate.now());
        }

        int count = (int) requestResponseRepository.countByRequestId(requestId);
        return BloodRequestRecipientResponseDto.fromEntity(request, count);
    }

    // ==========================================
    // DONOR OPERATIONS
    // ==========================================

    /**
     * Retrieves incoming blood requests where the donor's response is PENDING.
     */
    @Transactional(readOnly = true)
    public List<DonorIncomingRequestDto> getDonorPendingRequests(Long donorId) {
        User donor = userRepository.findById(donorId)
                .orElseThrow(() -> new NotFoundException("Donor not found"));

        List<RequestResponse> pendingResponses = requestResponseRepository
                .findByDonorIdAndStatusOrderByCreatedAtDesc(donorId, ResponseStatus.PENDING);

        return pendingResponses.stream()
                .filter(rr -> rr.getRequest().getStatus() == RequestStatus.PENDING)
                .map(rr -> {
                    BloodRequest req = rr.getRequest();
                    Double distance = calculateDistanceBetween(donor, req);
                    return DonorIncomingRequestDto.builder()
                            .requestId(req.getId())
                            .responseId(rr.getId())
                            .patientName(req.getPatientName())
                            .bloodGroup(req.getBloodGroup())
                            .unitsNeeded(req.getUnitsNeeded())
                            .urgency(req.getUrgency())
                            .city(req.getCity())
                            .distanceKm(distance)
                            .message(req.getMessage())
                            .requiredBy(req.getRequiredBy())
                            .createdAt(req.getCreatedAt())
                            .status(req.getStatus())
                            .myResponseStatus(rr.getStatus())
                            .build();
                })
                .toList();
    }

    /**
     * Returns detailed view of a blood request matched to the donor.
     * Recipient phone is populated only if this donor accepted the request.
     */
    @Transactional(readOnly = true)
    public DonorRequestDetailsDto getDonorRequestDetails(Long donorId, Long requestId) {
        RequestResponse rr = requestResponseRepository.findByRequestIdAndDonorId(requestId, donorId)
                .orElseThrow(() -> new ForbiddenException("You can only view requests that were matched to you"));

        User donor = rr.getDonor();
        BloodRequest req = rr.getRequest();
        Double distance = calculateDistanceBetween(donor, req);

        String recipientFullName = req.getRecipient().getName();
        String recipientFirstName = (recipientFullName != null && !recipientFullName.trim().isEmpty())
                ? recipientFullName.trim().split("\\s+")[0]
                : "Recipient";

        boolean hasAccepted = rr.getStatus() == ResponseStatus.ACCEPTED ||
                (req.getAcceptedDonor() != null && req.getAcceptedDonor().getId().equals(donorId));

        String recipientPhone = hasAccepted ? req.getRecipient().getPhone() : null;

        return DonorRequestDetailsDto.builder()
                .requestId(req.getId())
                .recipientFirstName(recipientFirstName)
                .patientName(req.getPatientName())
                .bloodGroup(req.getBloodGroup())
                .unitsNeeded(req.getUnitsNeeded())
                .urgency(req.getUrgency())
                .city(req.getCity())
                .distanceKm(distance)
                .message(req.getMessage())
                .requiredBy(req.getRequiredBy())
                .status(req.getStatus())
                .myResponseStatus(rr.getStatus())
                .createdAt(req.getCreatedAt())
                .recipientPhone(recipientPhone)
                .build();
    }

    /**
     * Donor accepts a blood request.
     * Transactional first-come-first-served: returns 409 Conflict if no longer PENDING.
     */
    @Transactional
    public AcceptRequestResponseDto acceptRequest(Long donorId, Long requestId) {
        RequestResponse myResponse = requestResponseRepository.findByRequestIdAndDonorId(requestId, donorId)
                .orElseThrow(() -> new ForbiddenException("You can only respond to requests that were matched to you"));

        BloodRequest req = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Blood request not found with ID: " + requestId));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new ConflictException("Request has already been accepted or is no longer available.");
        }

        if (myResponse.getStatus() != ResponseStatus.PENDING) {
            throw new BadRequestException("You have already responded to this request: " + myResponse.getStatus());
        }

        User donor = userRepository.findById(donorId)
                .orElseThrow(() -> new NotFoundException("Donor not found"));

        // Assign accepted donor and transition status
        req.setAcceptedDonor(donor);
        req.setStatus(RequestStatus.ACCEPTED);
        bloodRequestRepository.save(req);

        // Update donor response
        myResponse.setStatus(ResponseStatus.ACCEPTED);
        myResponse.setRespondedAt(LocalDateTime.now());
        requestResponseRepository.save(myResponse);

        // Expire all other responses for this request
        List<RequestResponse> otherResponses = requestResponseRepository.findByRequestId(requestId);
        for (RequestResponse other : otherResponses) {
            if (!other.getId().equals(myResponse.getId()) && other.getStatus() == ResponseStatus.PENDING) {
                other.setStatus(ResponseStatus.EXPIRED);
                other.setRespondedAt(LocalDateTime.now());
            }
        }
        requestResponseRepository.saveAll(otherResponses);

        // Notify recipient
        notificationService.notifyRecipientDonorAccepted(req, donor);

        log.info("BloodRequest ID: {} ACCEPTED by Donor ID: {}. Recipient ID: {} notified.",
                requestId, donorId, req.getRecipient().getId());

        return AcceptRequestResponseDto.builder()
                .requestId(req.getId())
                .message("Request accepted successfully. Please coordinate with the recipient.")
                .recipientName(req.getRecipient().getName())
                .recipientPhone(req.getRecipient().getPhone())
                .patientName(req.getPatientName())
                .bloodGroup(req.getBloodGroup())
                .city(req.getCity())
                .acceptedAt(myResponse.getRespondedAt())
                .build();
    }

    /**
     * Donor rejects a blood request.
     */
    @Transactional
    public void rejectRequest(Long donorId, Long requestId) {
        RequestResponse myResponse = requestResponseRepository.findByRequestIdAndDonorId(requestId, donorId)
                .orElseThrow(() -> new ForbiddenException("You can only respond to requests that were matched to you"));

        if (myResponse.getStatus() != ResponseStatus.PENDING) {
            throw new BadRequestException("You have already responded to this request: " + myResponse.getStatus());
        }

        myResponse.setStatus(ResponseStatus.REJECTED);
        myResponse.setRespondedAt(LocalDateTime.now());
        requestResponseRepository.save(myResponse);

        log.info("Donor ID: {} REJECTED BloodRequest ID: {}", donorId, requestId);
    }

    /**
     * Retrieves donation history for requests accepted or completed by this donor.
     */
    @Transactional(readOnly = true)
    public List<DonorRequestDetailsDto> getDonorHistory(Long donorId) {
        List<BloodRequest> acceptedRequests = bloodRequestRepository.findByAcceptedDonorIdOrderByCreatedAtDesc(donorId);
        User donor = userRepository.findById(donorId)
                .orElseThrow(() -> new NotFoundException("Donor not found"));

        return acceptedRequests.stream()
                .map(req -> {
                    Double distance = calculateDistanceBetween(donor, req);
                    String recipientFullName = req.getRecipient().getName();
                    String recipientFirstName = (recipientFullName != null && !recipientFullName.trim().isEmpty())
                            ? recipientFullName.trim().split("\\s+")[0]
                            : "Recipient";

                    return DonorRequestDetailsDto.builder()
                            .requestId(req.getId())
                            .recipientFirstName(recipientFirstName)
                            .patientName(req.getPatientName())
                            .bloodGroup(req.getBloodGroup())
                            .unitsNeeded(req.getUnitsNeeded())
                            .urgency(req.getUrgency())
                            .city(req.getCity())
                            .distanceKm(distance)
                            .message(req.getMessage())
                            .requiredBy(req.getRequiredBy())
                            .status(req.getStatus())
                            .myResponseStatus(ResponseStatus.ACCEPTED)
                            .createdAt(req.getCreatedAt())
                            .recipientPhone(req.getRecipient().getPhone())
                            .build();
                })
                .toList();
    }

    // ==========================================
    // SAFETY & REPORTING OPERATIONS
    // ==========================================

    /**
     * Reports a fake or suspicious blood request.
     * Enforces single report per user per request.
     * After 3 reports, automatically marks the request CANCELLED.
     */
    @Transactional
    public com.lifedrop.dto.ReportResponseDto reportRequest(Long reporterId, Long requestId, String reason) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new NotFoundException("Reporter user not found"));

        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Blood request not found with ID: " + requestId));

        if (reportRepository.existsByRequestIdAndReporterId(requestId, reporterId)) {
            throw new BadRequestException("You have already reported this blood request.");
        }

        com.lifedrop.entity.Report report = com.lifedrop.entity.Report.builder()
                .reporter(reporter)
                .request(request)
                .reason(reason.trim())
                .build();
        report = reportRepository.save(report);

        long reportCount = reportRepository.countByRequestId(requestId);
        boolean cancelled = false;

        // After 3 reports, mark the request CANCELLED
        if (reportCount >= 3 && request.getStatus() != RequestStatus.CANCELLED) {
            request.setStatus(RequestStatus.CANCELLED);
            bloodRequestRepository.save(request);

            List<RequestResponse> pending = requestResponseRepository.findByRequestIdAndStatus(requestId, ResponseStatus.PENDING);
            for (RequestResponse rr : pending) {
                rr.setStatus(ResponseStatus.EXPIRED);
                rr.setRespondedAt(LocalDateTime.now());
            }
            requestResponseRepository.saveAll(pending);

            cancelled = true;
            log.warn("🚨 BloodRequest ID: {} reached {} reports and has been automatically CANCELLED.",
                    requestId, reportCount);
        }

        String message = cancelled
                ? "Request reported successfully. This request has received 3 or more reports and has been automatically cancelled."
                : "Request reported successfully. Thank you for helping keep the LifeDrop community safe.";

        return com.lifedrop.dto.ReportResponseDto.builder()
                .reportId(report.getId())
                .requestId(requestId)
                .reason(report.getReason())
                .totalReports(reportCount)
                .requestCancelled(cancelled)
                .message(message)
                .reportedAt(report.getCreatedAt())
                .build();
    }

    // ==========================================
    // SCHEDULER / MAINTENANCE OPERATIONS
    // ==========================================

    /**
     * Expires PENDING requests older than 24 hours and all their pending responses.
     */
    @Transactional
    public int expireOldPendingRequests() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<BloodRequest> expiredRequests = bloodRequestRepository.findByStatusAndCreatedAtBefore(RequestStatus.PENDING, cutoff);

        int count = 0;
        for (BloodRequest request : expiredRequests) {
            request.setStatus(RequestStatus.EXPIRED);
            bloodRequestRepository.save(request);

            List<RequestResponse> pending = requestResponseRepository.findByRequestIdAndStatus(request.getId(), ResponseStatus.PENDING);
            for (RequestResponse rr : pending) {
                rr.setStatus(ResponseStatus.EXPIRED);
                rr.setRespondedAt(LocalDateTime.now());
            }
            requestResponseRepository.saveAll(pending);
            count++;
        }

        if (count > 0) {
            log.info("Scheduled task expired {} PENDING blood requests older than 24 hours", count);
        }
        return count;
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private Double calculateDistanceBetween(User donor, BloodRequest req) {
        if (donor.getLatitude() != null && donor.getLongitude() != null &&
                req.getLatitude() != null && req.getLongitude() != null) {
            double dist = DistanceCalculator.calculateDistance(
                    donor.getLatitude(), donor.getLongitude(),
                    req.getLatitude(), req.getLongitude()
            );
            return DistanceCalculator.roundToOneDecimal(dist);
        }
        return null;
    }
}
