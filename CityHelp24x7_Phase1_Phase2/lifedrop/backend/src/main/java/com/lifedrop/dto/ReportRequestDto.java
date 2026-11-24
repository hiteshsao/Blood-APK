package com.lifedrop.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for reporting a fake or inappropriate blood request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequestDto {

    @NotBlank(message = "Reason for reporting is required")
    private String reason;
}
