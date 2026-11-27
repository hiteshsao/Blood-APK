package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.FacilityRequest;
import com.lifedrop.dto.FacilityResponse;
import com.lifedrop.service.FacilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only maintenance of the hospitals / blood banks directory. Secured by SecurityConfig (/api/admin/**).
 */
@RestController
@RequestMapping("/api/admin/facilities")
@Tag(name = "Admin - Facilities", description = "Add, edit and soft-delete hospitals and blood banks")
@SecurityRequirement(name = "bearerAuth")
public class AdminFacilityController {

    private final FacilityService facilityService;

    public AdminFacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @PostMapping
    @Operation(summary = "Create a hospital or blood bank entry")
    public ResponseEntity<ApiResponse<FacilityResponse>> create(@Valid @RequestBody FacilityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Facility created successfully", facilityService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a hospital or blood bank entry")
    public ResponseEntity<ApiResponse<FacilityResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody FacilityRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Facility updated successfully", facilityService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete (active=false); it disappears from all public lists")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        facilityService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Facility removed successfully", null));
    }
}
