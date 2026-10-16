package com.lifedrop.dto;

import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Urgency;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Payload for creating a new blood donation request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBloodRequestDto {

    @NotBlank(message = "Patient name is required")
    private String patientName;

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @NotNull(message = "Units needed is required")
    @Min(value = 1, message = "At least 1 unit must be requested")
    private Integer unitsNeeded;

    @NotNull(message = "Urgency level is required (NORMAL or URGENT)")
    private Urgency urgency;

    private String city;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    // Optional: defaults to 10 km for NORMAL, 25 km for URGENT if omitted or <= 0
    private Double radiusKm;

    private String message;

    private LocalDateTime requiredBy;
}
