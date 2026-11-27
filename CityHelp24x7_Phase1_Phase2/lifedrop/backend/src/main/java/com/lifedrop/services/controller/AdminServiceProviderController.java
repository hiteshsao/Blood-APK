package com.lifedrop.services.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.services.dto.AdminDecisionRequest;
import com.lifedrop.services.dto.ProviderResponse;
import com.lifedrop.services.enums.VerificationStatus;
import com.lifedrop.services.service.ServiceProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin-only verification of providers. Secured by SecurityConfig (/api/admin/**). */
@RestController
@RequestMapping("/api/admin/services/providers")
@Tag(name = "Admin - Service Providers", description = "Verify, reject, suspend and reinstate providers")
@SecurityRequirement(name = "bearerAuth")
public class AdminServiceProviderController {

    private final ServiceProviderService service;

    public AdminServiceProviderController(ServiceProviderService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List providers, optionally by verification status")
    public ResponseEntity<ApiResponse<List<ProviderResponse>>> list(@RequestParam(required = false) VerificationStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Providers retrieved successfully", service.adminList(status)));
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<ProviderResponse>> verify(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Provider verified", service.verify(id)));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ProviderResponse>> reject(@PathVariable Long id,
                                                                @Valid @RequestBody(required = false) AdminDecisionRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Provider rejected", service.reject(id, body == null ? null : body.reason())));
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<ProviderResponse>> suspend(@PathVariable Long id,
                                                                 @Valid @RequestBody(required = false) AdminDecisionRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Provider suspended", service.suspend(id, body == null ? null : body.reason())));
    }

    @PutMapping("/{id}/reinstate")
    public ResponseEntity<ApiResponse<ProviderResponse>> reinstate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Provider reinstated", service.reinstate(id)));
    }
}
