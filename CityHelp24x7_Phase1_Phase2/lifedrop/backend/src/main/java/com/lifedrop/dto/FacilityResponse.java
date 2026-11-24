package com.lifedrop.dto;

import com.lifedrop.entity.Facility;
import com.lifedrop.enums.FacilityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public view of a hospital or blood bank entry.
 * distanceKm is only set when the caller supplied lat/lng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityResponse {

    private Long id;
    private FacilityType type;
    private String name;
    private String address;
    private String phone;
    private String emergencyPhone;
    private Long cityId;
    private Double latitude;
    private Double longitude;
    private Boolean open24x7;
    private String notes;
    private Boolean verified;
    private Double distanceKm;
    /** True for seeded sample entries (name starts with "Sample "). */
    private Boolean sample;

    public static FacilityResponse fromEntity(Facility f, Double distanceKm) {
        return FacilityResponse.builder()
                .id(f.getId())
                .type(f.getType())
                .name(f.getName())
                .address(f.getAddress())
                .phone(f.getPhone())
                .emergencyPhone(f.getEmergencyPhone())
                .cityId(f.getCityId())
                .latitude(f.getLatitude())
                .longitude(f.getLongitude())
                .open24x7(f.getOpen24x7())
                .notes(f.getNotes())
                .verified(f.getVerified())
                .distanceKm(distanceKm)
                .sample(f.getName() != null && f.getName().startsWith("Sample "))
                .build();
    }
}
