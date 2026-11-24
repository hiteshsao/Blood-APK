package com.lifedrop.services.dto;

import com.lifedrop.services.enums.PriceUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Register or update a provider profile. */
public record ProviderRequest(
        @NotNull(message = "Category is required") Long categoryId,
        @NotNull(message = "City is required") Long cityId,
        @NotBlank(message = "Display name is required") @Size(max = 100, message = "Display name is too long") String displayName,
        @Size(max = 1000, message = "Description must be at most 1000 characters") String description,
        @NotBlank(message = "Address is required") @Size(max = 255, message = "Address is too long") String address,
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^[0-9+\\- ]{7,15}$", message = "Enter a valid phone number") String phone,
        @Min(value = 0, message = "Experience cannot be negative") @Max(value = 60, message = "Experience is too high") Integer experienceYears,
        @DecimalMin(value = "0.0", message = "Price cannot be negative") BigDecimal priceFrom,
        PriceUnit priceUnit,
        Double latitude,
        Double longitude
) {
}
