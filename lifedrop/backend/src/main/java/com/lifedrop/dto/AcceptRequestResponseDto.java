package com.lifedrop.dto;

import com.lifedrop.enums.BloodGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response returned immediately after a donor accepts a blood donation request,
 * providing the recipient contact details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptRequestResponseDto {

    private Long requestId;
    private String message;
    private String recipientName;
    private String recipientPhone;
    private String patientName;
    private BloodGroup bloodGroup;
    private String city;
    private LocalDateTime acceptedAt;
}
