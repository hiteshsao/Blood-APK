package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public, aggregate-only platform numbers for the landing page.
 * Returns counts only — never any personal data.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Public Stats", description = "Aggregate platform statistics for the landing page")
public class StatsController {

    private final UserRepository userRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final CityRepository cityRepository;

    public StatsController(UserRepository userRepository,
                           BloodRequestRepository bloodRequestRepository,
                           CityRepository cityRepository) {
        this.userRepository = userRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.cityRepository = cityRepository;
    }

    @GetMapping("/stats")
    @Operation(summary = "Get public platform statistics (donors, requests, cities, lives helped)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("donors", userRepository.countByDonorEnabledTrueAndActiveTrue());
        stats.put("requests", bloodRequestRepository.count());
        stats.put("cities", cityRepository.countByActiveTrue());
        stats.put("livesHelped", bloodRequestRepository.countByStatus(RequestStatus.COMPLETED));
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
