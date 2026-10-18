package com.lifedrop.dto;

import com.lifedrop.enums.BloodGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Public donor summary response for recipients searching for nearby donors.
 * Note: NEVER exposes phone number, email address, or exact GPS coordinates
 * to protect donor privacy prior to request acceptance.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorResponseDto {

    private Long id;
    private String firstName;
    private BloodGroup bloodGroup;
    private Double distanceKm;
    private String city;
    private LocalDate lastDonatedDate;
    private Double latitude;
    private Double longitude;
}
