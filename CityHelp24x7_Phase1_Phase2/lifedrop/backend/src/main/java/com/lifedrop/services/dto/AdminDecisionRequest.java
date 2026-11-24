package com.lifedrop.services.dto;

import jakarta.validation.constraints.Size;

/** Reason for reject / suspend (optional for verify / reinstate). */
public record AdminDecisionRequest(@Size(max = 500, message = "Reason must be at most 500 characters") String reason) {
}
