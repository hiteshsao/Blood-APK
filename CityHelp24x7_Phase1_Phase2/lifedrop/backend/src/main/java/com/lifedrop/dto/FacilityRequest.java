package com.lifedrop.dto;

import com.lifedrop.enums.FacilityType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin payload to create or update a hospital / blood bank entry.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityRequest {

    @NotNull(message = "Type is required (HOSPITAL or BLOOD_BANK)")
    private FacilityType type;

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name must be at most 150 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(max = 300, message = "Address must be at most 300 characters")
    private String address;

    @Size(max = 20, message = "Phone must be at most 20 characters")
    private String phone;

    @Size(max = 20, message = "Emergency phone must be at most 20 characters")
    private String emergencyPhone;

    @NotNull(message = "City is required")
    private Long cityId;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    private Boolean open24x7;

    @Size(max = 500, message = "Notes must be at most 500 characters")
    private String notes;

    private Boolean verified;

    /** Optional. Lets an admin re-activate a soft-deleted entry. */
    private Boolean active;
}
