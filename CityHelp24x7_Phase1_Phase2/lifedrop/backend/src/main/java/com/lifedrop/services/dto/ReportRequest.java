package com.lifedrop.services.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportRequest(
        @NotBlank(message = "Please tell us what went wrong") @Size(max = 500, message = "Reason must be at most 500 characters") String reason
) {
}
