package com.lifedrop.controller;

import com.lifedrop.dto.AcceptRequestResponseDto;
import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.AvailabilityRequest;
import com.lifedrop.dto.DonorIncomingRequestDto;
import com.lifedrop.dto.DonorRequestDetailsDto;
import com.lifedrop.dto.EligibilityResponse;
import com.lifedrop.dto.UserProfileResponse;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.BloodRequestService;
import com.lifedrop.service.DonorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller restricted exclusively to verified Donors.
 * Provides availability toggling, donation gap eligibility checks, incoming request responses, and history.
 */
@RestController
@RequestMapping("/api/donor")
@Tag(name = "Donor Operations", description = "Endpoints accessible ONLY by verified Donors")
@SecurityRequirement(name = "bearerAuth")
public class DonorController {

    private final DonorService donorService;
    private final BloodRequestService bloodRequestService;

    public DonorController(DonorService donorService, BloodRequestService bloodRequestService) {
        this.donorService = donorService;
        this.bloodRequestService = bloodRequestService;
    }

    @GetMapping("/requests")
    @Operation(summary = "Get incoming requests where my response is PENDING")
    public ResponseEntity<ApiResponse<List<DonorIncomingRequestDto>>> getIncomingRequests(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DonorIncomingRequestDto> requests = bloodRequestService.getDonorPendingRequests(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Retrieved " + requests.size() + " incoming blood requests",
                requests
        ));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get request details (recipient phone included ONLY if accepted)")
    public ResponseEntity<ApiResponse<DonorRequestDetailsDto>> getRequestDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        DonorRequestDetailsDto details = bloodRequestService.getDonorRequestDetails(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Blood request details retrieved successfully", details));
    }

    @PostMapping("/requests/{id}/accept")
    @Operation(summary = "Accept a blood request. First donor wins; returns 409 if already accepted.")
    public ResponseEntity<ApiResponse<AcceptRequestResponseDto>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        AcceptRequestResponseDto response = bloodRequestService.acceptRequest(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Blood request accepted successfully", response));
    }

    @PostMapping("/requests/{id}/reject")
    @Operation(summary = "Reject a blood request")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        bloodRequestService.rejectRequest(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(
                "Blood request rejected",
                Map.of("requestId", id, "status", "REJECTED")
        ));
    }

    @GetMapping("/history")
    @Operation(summary = "Get blood donation requests accepted or completed by this donor")
    public ResponseEntity<ApiResponse<List<DonorRequestDetailsDto>>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DonorRequestDetailsDto> history = bloodRequestService.getDonorHistory(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Retrieved " + history.size() + " donation history records",
                history
        ));
    }

    @PutMapping("/availability")
    @Operation(summary = "Update donor blood donation availability status (enforces 90-day eligibility rule)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateAvailability(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AvailabilityRequest request
    ) {
        UserProfileResponse updated = donorService.updateAvailability(principal.getId(), request.getAvailable());
        return ResponseEntity.ok(ApiResponse.success(
                Boolean.TRUE.equals(request.getAvailable()) ? "Availability turned ON" : "Availability turned OFF",
                updated
        ));
    }

    @GetMapping("/eligibility")
    @Operation(summary = "Check blood donation eligibility, last donation, next eligible date, and remaining gap days")
    public ResponseEntity<ApiResponse<EligibilityResponse>> checkEligibility(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        EligibilityResponse response = donorService.checkEligibility(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Eligibility checked successfully", response));
    }

    @GetMapping("/test")
    @Operation(summary = "Donor-only test endpoint")
    public ResponseEntity<ApiResponse<Map<String, Object>>> donorTest(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Welcome to the Donor Portal",
                Map.of(
                        "donorId", principal.getId(),
                        "donorEmail", principal.getEmail(),
                        "role", principal.getRole().name()
                )
        ));
    }
}
