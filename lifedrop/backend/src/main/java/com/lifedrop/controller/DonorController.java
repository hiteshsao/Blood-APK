package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.AvailabilityRequest;
import com.lifedrop.dto.EligibilityResponse;
import com.lifedrop.dto.UserProfileResponse;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.DonorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller restricted exclusively to verified Donors.
 * Provides availability toggling and donation gap eligibility checks.
 */
@RestController
@RequestMapping("/api/donor")
@Tag(name = "Donor Operations", description = "Endpoints accessible ONLY by verified Donors")
@SecurityRequirement(name = "bearerAuth")
public class DonorController {

    private final DonorService donorService;

    public DonorController(DonorService donorService) {
        this.donorService = donorService;
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
