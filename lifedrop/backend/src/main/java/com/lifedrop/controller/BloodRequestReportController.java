package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.ReportRequestDto;
import com.lifedrop.dto.ReportResponseDto;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.BloodRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for community safety and reporting fraudulent blood requests.
 * Accessible by any authenticated donor or recipient.
 */
@RestController
@RequestMapping("/api/requests")
@Tag(name = "Request Safety & Reports", description = "Endpoints for reporting suspicious or fraudulent blood requests")
@SecurityRequirement(name = "bearerAuth")
public class BloodRequestReportController {

    private final BloodRequestService bloodRequestService;

    public BloodRequestReportController(BloodRequestService bloodRequestService) {
        this.bloodRequestService = bloodRequestService;
    }

    @PostMapping("/{id}/report")
    @Operation(summary = "Report a fake or suspicious blood request (auto-cancelled after 3 reports)")
    public ResponseEntity<ApiResponse<ReportResponseDto>> reportRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ReportRequestDto dto
    ) {
        ReportResponseDto response = bloodRequestService.reportRequest(principal.getId(), id, dto.getReason());
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }
}
