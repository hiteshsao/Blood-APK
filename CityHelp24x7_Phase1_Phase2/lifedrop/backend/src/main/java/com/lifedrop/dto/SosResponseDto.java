package com.lifedrop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload returned upon successful creation of an emergency SOS alert.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SosResponseDto {

    private Long requestId;
    private int donorsNotified;
    private Double radiusKm;
    private String status;
    private String message;
}
