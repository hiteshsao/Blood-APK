package com.lifedrop.services.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record BookingRequest(
        @NotNull(message = "Provider is required") Long providerId,
        @NotNull(message = "Date and time is required") LocalDateTime scheduledAt,
        @NotBlank(message = "Describe the work needed") @Size(max = 500, message = "Description must be at most 500 characters") String description,
        @NotBlank(message = "Address is required") @Size(max = 255, message = "Address is too long") String address
) {
}
