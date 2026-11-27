package com.lifedrop.services.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.services.dto.BookingNoteRequest;
import com.lifedrop.services.dto.BookingRequest;
import com.lifedrop.services.dto.BookingResponse;
import com.lifedrop.services.dto.ReviewRequest;
import com.lifedrop.services.dto.ReviewResponse;
import com.lifedrop.services.service.BookingService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/services/bookings")
@Tag(name = "Service Bookings", description = "Book a provider, accept / reject / cancel / complete, review")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @Operation(summary = "Request a booking (max 5 pending per customer)")
    public ResponseEntity<ApiResponse<BookingResponse>> create(@AuthenticationPrincipal UserPrincipal principal,
                                                               @Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking requested", bookingService.create(principal.getId(), request)));
    }

    @GetMapping("/mine")
    @Operation(summary = "Bookings I made as a customer")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved successfully", bookingService.mine(principal.getId())));
    }

    @GetMapping("/provider")
    @Operation(summary = "Bookings I received as a provider")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> provider(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved successfully", bookingService.forProvider(principal.getId())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "One booking (customer or provider only)")
    public ResponseEntity<ApiResponse<BookingResponse>> get(@AuthenticationPrincipal UserPrincipal principal,
                                                            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Booking retrieved successfully", bookingService.get(principal.getId(), id)));
    }

    @PutMapping("/{id}/accept")
    @Operation(summary = "Provider accepts a pending booking")
    public ResponseEntity<ApiResponse<BookingResponse>> accept(@AuthenticationPrincipal UserPrincipal principal,
                                                               @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Booking accepted", bookingService.accept(principal.getId(), id)));
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Provider rejects a pending booking")
    public ResponseEntity<ApiResponse<BookingResponse>> reject(@AuthenticationPrincipal UserPrincipal principal,
                                                               @PathVariable Long id,
                                                               @Valid @RequestBody(required = false) BookingNoteRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Booking rejected",
                bookingService.reject(principal.getId(), id, body == null ? null : body.note())));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel a booking (customer: pending or accepted; provider: accepted)")
    public ResponseEntity<ApiResponse<BookingResponse>> cancel(@AuthenticationPrincipal UserPrincipal principal,
                                                               @PathVariable Long id,
                                                               @Valid @RequestBody(required = false) BookingNoteRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled",
                bookingService.cancel(principal.getId(), id, body == null ? null : body.note())));
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Provider marks an accepted booking as completed")
    public ResponseEntity<ApiResponse<BookingResponse>> complete(@AuthenticationPrincipal UserPrincipal principal,
                                                                 @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Booking completed", bookingService.complete(principal.getId(), id)));
    }

    @PostMapping("/{id}/review")
    @Operation(summary = "Customer rates a completed booking (1-5 stars)")
    public ResponseEntity<ApiResponse<ReviewResponse>> review(@AuthenticationPrincipal UserPrincipal principal,
                                                              @PathVariable Long id,
                                                              @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thanks for your review", bookingService.review(principal.getId(), id, request)));
    }
}
