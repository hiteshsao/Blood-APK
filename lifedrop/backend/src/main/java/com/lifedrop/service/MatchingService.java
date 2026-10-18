package com.lifedrop.service;

import com.lifedrop.dto.DonorResponseDto;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.repository.NearbyDonorProjection;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.util.BloodCompatibility;
import com.lifedrop.util.DistanceCalculator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Service for matching blood requests/recipients with compatible, eligible nearby donors.
 */
@Service
public class MatchingService {

    private final UserRepository userRepository;
    private final int donationGapDays;

    public MatchingService(
            UserRepository userRepository,
            @Value("${donation.gap-days:90}") int donationGapDays
    ) {
        this.userRepository = userRepository;
        this.donationGapDays = donationGapDays;
    }

    /**
     * Finds compatible, eligible donors within radiusKm of coordinates.
     */
    @Transactional(readOnly = true)
    public List<DonorResponseDto> findCompatibleDonors(
            BloodGroup recipientBloodGroup,
            double lat,
            double lng,
            double radiusKm
    ) {
        if (recipientBloodGroup == null) {
            throw new BadRequestException("Recipient blood group is required");
        }
        if (lat < -90.0 || lat > 90.0) {
            throw new BadRequestException("Latitude must be between -90 and 90 degrees");
        }
        if (lng < -180.0 || lng > 180.0) {
            throw new BadRequestException("Longitude must be between -180 and 180 degrees");
        }
        if (radiusKm <= 0.0) {
            radiusKm = 10.0;
        }

        LocalDate eligibleBefore = LocalDate.now().minusDays(donationGapDays);
        List<String> compatibleGroups = BloodCompatibility.getCompatibleDonorNames(recipientBloodGroup);

        if (compatibleGroups.isEmpty()) {
            return Collections.emptyList();
        }

        List<NearbyDonorProjection> projections = userRepository.findNearbyDonors(
                compatibleGroups,
                lat,
                lng,
                radiusKm,
                eligibleBefore
        );

        return projections.stream()
                .map(this::toDonorResponseDto)
                .toList();
    }

    private DonorResponseDto toDonorResponseDto(NearbyDonorProjection p) {
        String fullName = p.getName();
        String firstName = (fullName != null && !fullName.trim().isEmpty())
                ? fullName.trim().split("\\s+")[0]
                : "Donor";

        BloodGroup bloodGroup = null;
        if (p.getBloodGroup() != null) {
            try {
                bloodGroup = BloodGroup.fromLabel(p.getBloodGroup());
            } catch (Exception e) {
                try {
                    bloodGroup = BloodGroup.valueOf(p.getBloodGroup());
                } catch (Exception ignored) {
                }
            }
        }

        double distance = p.getDistance() != null ? p.getDistance() : 0.0;

        return DonorResponseDto.builder()
                .id(p.getId())
                .firstName(firstName)
                .bloodGroup(bloodGroup)
                .distanceKm(DistanceCalculator.roundToOneDecimal(distance))
                .city(p.getCity())
                .lastDonatedDate(p.getLastDonatedDate())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .build();
    }
}
