package com.lifedrop.dto;

import com.lifedrop.entity.BloodRequest;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.Urgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Detailed BloodRequest representation returned to the recipient.
 * If status is ACCEPTED or COMPLETED, includes the accepted donor's name and phone.
 * Otherwise, donor phone is strictly omitted.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloodRequestRecipientResponseDto {

    private Long id;
    private String patientName;
    private BloodGroup bloodGroup;
    private Integer unitsNeeded;
    private Urgency urgency;
    private String city;
    private Double latitude;
    private Double longitude;
    private Double radiusKm;
    private String message;
    private LocalDateTime requiredBy;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private Integer matchedDonorCount;

    // Contact info revealed ONLY after donor accepts
    private AcceptedDonorContactDto acceptedDonor;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcceptedDonorContactDto {
        private Long id;
        private String name;
        private String phone;
        private BloodGroup bloodGroup;
        private String city;
    }

    public static BloodRequestRecipientResponseDto fromEntity(BloodRequest request, Integer matchedDonorCount) {
        if (request == null) {
            return null;
        }

        AcceptedDonorContactDto donorDto = null;
        boolean canShowDonorContact = (request.getStatus() == RequestStatus.ACCEPTED || request.getStatus() == RequestStatus.COMPLETED);
        if (canShowDonorContact && request.getAcceptedDonor() != null) {
            donorDto = AcceptedDonorContactDto.builder()
                    .id(request.getAcceptedDonor().getId())
                    .name(request.getAcceptedDonor().getName())
                    .phone(request.getAcceptedDonor().getPhone())
                    .bloodGroup(request.getAcceptedDonor().getBloodGroup())
                    .city(request.getAcceptedDonor().getCity())
                    .build();
        }

        return BloodRequestRecipientResponseDto.builder()
                .id(request.getId())
                .patientName(request.getPatientName())
                .bloodGroup(request.getBloodGroup())
                .unitsNeeded(request.getUnitsNeeded())
                .urgency(request.getUrgency())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radiusKm(request.getRadiusKm())
                .message(request.getMessage())
                .requiredBy(request.getRequiredBy())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .matchedDonorCount(matchedDonorCount)
                .acceptedDonor(donorDto)
                .build();
    }
}
