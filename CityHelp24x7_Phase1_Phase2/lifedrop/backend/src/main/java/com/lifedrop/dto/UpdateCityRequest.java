package com.lifedrop.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for PUT /api/users/city.
 */
@Data
public class UpdateCityRequest {

    @NotNull(message = "cityId is required")
    private Long cityId;
}

