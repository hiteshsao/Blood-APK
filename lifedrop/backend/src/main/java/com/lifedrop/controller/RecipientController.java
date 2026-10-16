package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.DonorResponseDto;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.MatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller restricted exclusively to verified Recipients.
 * Provides nearby donor discovery matching blood compatibility rules.
 */
@RestController
@RequestMapping("/api/recipient")
@Tag(name = "Recipient Operations", description = "Endpoints accessible ONLY by verified Recipients")
@SecurityRequirement(name = "bearerAuth")
public class RecipientController {

    private final MatchingService matchingService;

    public RecipientController(MatchingService matchingService) {
        this.matchingService = matchingService;
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
