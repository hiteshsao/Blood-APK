package com.lifedrop.dto;

import com.lifedrop.enums.BloodGroup;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for enabling or updating a user's donor profile via PUT /api/users/donor-profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDonorProfileRequest {

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @NotNull(message = "Age is required")
    @Min(value = 18, message = "Donor must be between 18 and 65 years old")
    @Max(value = 65, message = "Donor must be between 18 and 65 years old")
    private Integer age;

    private String gender;

    private Boolean available;
}

