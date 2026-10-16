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
 * Detailed request view for a donor.
 * Recipient phone is populated ONLY if the donor has accepted this request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorRequestDetailsDto {

    private Long requestId;
    private String recipientFirstName;
    private String patientName;
    private BloodGroup bloodGroup;
    private Integer unitsNeeded;
    private Urgency urgency;
    private String city;
    private Double distanceKm;
    private String message;
    private LocalDateTime requiredBy;
    private RequestStatus status;
    private ResponseStatus myResponseStatus;
    private LocalDateTime createdAt;

    // Revealed ONLY if this donor accepted the request
    private String recipientPhone;
}
