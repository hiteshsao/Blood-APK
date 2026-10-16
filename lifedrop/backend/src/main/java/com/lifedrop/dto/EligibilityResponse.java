package com.lifedrop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Donor eligibility response based on donation gap interval.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityResponse {

    private boolean eligible;
    private LocalDate lastDonatedDate;
    private LocalDate nextEligibleDate;
    private long daysRemaining;
}
