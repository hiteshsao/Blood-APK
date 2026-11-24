package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.CityResponse;
import com.lifedrop.service.CityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public endpoint for browsing supported cities in City Help 24x7.
 */
@RestController
@RequestMapping("/api/cities")
@Tag(name = "Cities", description = "Public city endpoints")
public class CityController {

    private final CityService cityService;

    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    @Operation(summary = "Get all active cities ordered by sortOrder and name")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getActiveCities() {
        List<CityResponse> cities = cityService.getActiveCities();
        return ResponseEntity.ok(ApiResponse.success("Cities retrieved successfully", cities));
    }
}

