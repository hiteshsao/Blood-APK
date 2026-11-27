package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.FacilityResponse;
import com.lifedrop.dto.PageResponse;
import com.lifedrop.enums.FacilityType;
import com.lifedrop.service.FacilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated, read-only directory of hospitals and blood banks.
 */
@RestController
@RequestMapping("/api/facilities")
@Tag(name = "Facilities", description = "Hospitals and blood banks directory (information only)")
@SecurityRequirement(name = "bearerAuth")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    @Operation(summary = "Search hospitals and blood banks (filters: type, city, radius, text, open 24x7)")
    public ResponseEntity<ApiResponse<PageResponse<FacilityResponse>>> search(
            @RequestParam(required = false) FacilityType type,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean open24x7,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageResponse<FacilityResponse> result =
                facilityService.search(type, cityId, lat, lng, radiusKm, q, open24x7, page, size);
        return ResponseEntity.ok(ApiResponse.success("Facilities retrieved successfully", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one hospital or blood bank by id")
    public ResponseEntity<ApiResponse<FacilityResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Facility retrieved successfully", facilityService.getById(id)));
    }
}
