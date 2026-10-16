package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller restricted exclusively to DONOR role.
 */
@RestController
@RequestMapping("/api/donor")
@Tag(name = "Donor Operations", description = "Endpoints accessible ONLY by verified Donors")
public class DonorTestController {

    @GetMapping("/test")
    @Operation(summary = "Donor-only test endpoint", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Object>>> donorTest(@AuthenticationPrincipal UserPrincipal principal) {
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
