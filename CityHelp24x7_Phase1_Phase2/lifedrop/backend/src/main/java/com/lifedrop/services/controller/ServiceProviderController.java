package com.lifedrop.services.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.PageResponse;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.services.dto.AvailabilityRequest;
import com.lifedrop.services.dto.CategoryResponse;
import com.lifedrop.services.dto.ProviderRequest;
import com.lifedrop.services.dto.ProviderResponse;
import com.lifedrop.services.dto.ReportRequest;
import com.lifedrop.services.dto.ReviewResponse;
import com.lifedrop.services.service.ServiceProviderService;
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

@RestController
@RequestMapping("/api/services")
@Tag(name = "Services", description = "Service providers: categories, discovery, own profile")
@SecurityRequirement(name = "bearerAuth")
public class ServiceProviderController {

    private final ServiceProviderService service;

    public ServiceProviderController(ServiceProviderService service) {
        this.service = service;
    }

    @GetMapping("/categories")
    @Operation(summary = "List service categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> categories() {
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved successfully", service.categories()));
    }

    @GetMapping("/providers")
    @Operation(summary = "Find verified providers (filters: category, city, radius, text, rating; sort: rating|distance|price)")
    public ResponseEntity<ApiResponse<PageResponse<ProviderResponse>>> search(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Providers retrieved successfully",
                service.search(categoryId, cityId, lat, lng, radiusKm, q, minRating, sort, page, size)));
    }

    @PostMapping("/providers")
    @Operation(summary = "Register as a service provider (goes to admin verification)")
    public ResponseEntity<ApiResponse<ProviderResponse>> register(@AuthenticationPrincipal UserPrincipal principal,
                                                                  @Valid @RequestBody ProviderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile submitted for verification", service.register(principal.getId(), request)));
    }

    @GetMapping("/providers/me")
    @Operation(summary = "My provider profile")
    public ResponseEntity<ApiResponse<ProviderResponse>> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", service.me(principal.getId())));
    }

    @PutMapping("/providers/me")
    @Operation(summary = "Update my provider profile (a rejected profile returns to review)")
    public ResponseEntity<ApiResponse<ProviderResponse>> updateMe(@AuthenticationPrincipal UserPrincipal principal,
                                                                  @Valid @RequestBody ProviderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", service.updateMe(principal.getId(), request)));
    }

    @PutMapping("/providers/me/availability")
    @Operation(summary = "Turn bookings on or off")
    public ResponseEntity<ApiResponse<ProviderResponse>> availability(@AuthenticationPrincipal UserPrincipal principal,
                                                                      @Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Availability updated",
                service.setAvailability(principal.getId(), request.available())));
    }

    @GetMapping("/providers/{id}")
    @Operation(summary = "Provider detail (contact visible only after an accepted booking)")
    public ResponseEntity<ApiResponse<ProviderResponse>> detail(@AuthenticationPrincipal UserPrincipal principal,
                                                                @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Provider retrieved successfully", service.getById(principal.getId(), id)));
    }

    @GetMapping("/providers/{id}/reviews")
    @Operation(summary = "Reviews of a provider")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> reviews(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully", service.reviews(id)));
    }

    @PostMapping("/providers/{id}/report")
    @Operation(summary = "Report a provider (3 reports suspend the profile)")
    public ResponseEntity<ApiResponse<Void>> report(@AuthenticationPrincipal UserPrincipal principal,
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody ReportRequest request) {
        service.report(principal.getId(), id, request.reason());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Report submitted", null));
    }
}
