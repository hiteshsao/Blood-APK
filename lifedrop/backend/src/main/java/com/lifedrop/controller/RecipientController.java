package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.BloodRequestRecipientResponseDto;
import com.lifedrop.dto.CreateBloodRequestDto;
import com.lifedrop.dto.DonorResponseDto;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.BloodRequestService;
import com.lifedrop.service.MatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller restricted exclusively to verified Recipients.
 * Handles blood request lifecycle and nearby donor discovery.
 */
@RestController
@RequestMapping("/api/recipient")
@Tag(name = "Recipient Operations", description = "Endpoints accessible ONLY by verified Recipients")
@SecurityRequirement(name = "bearerAuth")
public class RecipientController {

    private final MatchingService matchingService;
    private final BloodRequestService bloodRequestService;

    public RecipientController(MatchingService matchingService, BloodRequestService bloodRequestService) {
        this.matchingService = matchingService;
        this.bloodRequestService = bloodRequestService;
    }

    @PostMapping("/requests")
    @Operation(summary = "Create a new blood donation request and notify matched nearby donors")
    public ResponseEntity<ApiResponse<BloodRequestRecipientResponseDto>> createRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateBloodRequestDto dto
    ) {
        BloodRequestRecipientResponseDto response = bloodRequestService.createRequest(principal.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                String.format("Blood request created successfully. %d nearby compatible donors notified.",
                        response.getMatchedDonorCount() != null ? response.getMatchedDonorCount() : 0),
                response
        ));
    }

    @GetMapping("/requests")
    @Operation(summary = "Get all blood requests created by logged-in recipient (newest first)")
    public ResponseEntity<ApiResponse<List<BloodRequestRecipientResponseDto>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<BloodRequestRecipientResponseDto> requests = bloodRequestService.getRecipientRequests(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Retrieved " + requests.size() + " blood requests",
                requests
        ));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get request details. Includes donor name/phone ONLY if ACCEPTED or COMPLETED")
    public ResponseEntity<ApiResponse<BloodRequestRecipientResponseDto>> getRequestDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        BloodRequestRecipientResponseDto request = bloodRequestService.getRecipientRequestDetails(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Blood request details retrieved successfully", request));
    }

    @PutMapping("/requests/{id}/cancel")
    @Operation(summary = "Cancel an active blood donation request")
    public ResponseEntity<ApiResponse<BloodRequestRecipientResponseDto>> cancelRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        BloodRequestRecipientResponseDto cancelled = bloodRequestService.cancelRequest(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Blood request cancelled successfully", cancelled));
    }

    @PostMapping("/requests/{id}/complete")
    @Operation(summary = "Complete an ACCEPTED blood request and update donor's lastDonatedDate to today")
    public ResponseEntity<ApiResponse<BloodRequestRecipientResponseDto>> completeRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        BloodRequestRecipientResponseDto completed = bloodRequestService.completeRequest(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(
                "Blood request marked as COMPLETED. Donor's last donation date updated to today.",
                completed
        ));
    }

    @GetMapping("/donors/nearby")
    @Operation(summary = "Search compatible, eligible donors within radiusKm")
    public ResponseEntity<ApiResponse<List<DonorResponseDto>>> findNearbyDonors(
            @RequestParam(name = "bloodGroup") String bloodGroupStr,
            @RequestParam(name = "lat") double lat,
            @RequestParam(name = "lng") double lng,
            @RequestParam(name = "radiusKm", defaultValue = "10.0") double radiusKm
    ) {
        BloodGroup bloodGroup = BloodGroup.fromLabel(bloodGroupStr);
        List<DonorResponseDto> donors = matchingService.findCompatibleDonors(bloodGroup, lat, lng, radiusKm);
        return ResponseEntity.ok(ApiResponse.success(
                String.format("Found %d compatible nearby donors", donors.size()),
                donors
        ));
    }

    @GetMapping("/test")
    @Operation(summary = "Recipient-only test endpoint")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recipientTest(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Welcome to the Recipient Portal",
                Map.of(
                        "recipientId", principal.getId(),
                        "recipientEmail", principal.getEmail(),
                        "role", principal.getRole().name()
                )
        ));
    }
}
