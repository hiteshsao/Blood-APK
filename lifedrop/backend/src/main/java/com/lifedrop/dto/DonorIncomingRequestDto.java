package com.lifedrop.dto;

import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.ResponseStatus;
import com.lifedrop.enums.Urgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Incoming request summary presented in the donor's feed.
 * Never includes recipient phone number or exact GPS coordinates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorIncomingRequestDto {

    private Long requestId;
    private Long responseId;
    private String patientName;
    private BloodGroup bloodGroup;
    private Integer unitsNeeded;
    private Urgency urgency;
    private String city;
    private Double distanceKm;
    private String message;
    private LocalDateTime requiredBy;
    private LocalDateTime createdAt;
    private RequestStatus status;
    private ResponseStatus myResponseStatus;
}
