package com.lifedrop.service;

import com.lifedrop.dto.DonorResponseDto;
import com.lifedrop.entity.City;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.repository.CityRepository;
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
    private final CityRepository cityRepository;
    private final int donationGapDays;

    public MatchingService(
            UserRepository userRepository,
            CityRepository cityRepository,
            @Value("${donation.gap-days:90}") int donationGapDays
    ) {
        this.userRepository = userRepository;
        this.cityRepository = cityRepository;
        this.donationGapDays = donationGapDays;
    }

    /**
     * Finds compatible, eligible donors within radiusKm of coordinates,
     * optionally filtered by cityId and excluding a specific user ID (e.g., the requester).
     */
    @Transactional(readOnly = true)
    public List<DonorResponseDto> findCompatibleDonors(
            BloodGroup recipientBloodGroup,
            Double lat,
            Double lng,
            double radiusKm,
            Long cityId,
            Long excludeUserId
    ) {
        if (recipientBloodGroup == null) {
            throw new BadRequestException("Recipient blood group is required");
        }
        if (radiusKm <= 0.0) {
            radiusKm = 10.0;
        }

        LocalDate eligibleBefore = LocalDate.now().minusDays(donationGapDays);
        List<String> compatibleGroups = BloodCompatibility.getCompatibleDonorNames(recipientBloodGroup);

        if (compatibleGroups.isEmpty()) {
            return Collections.emptyList();
        }

        long excludedId = excludeUserId != null ? excludeUserId : -1L;
        List<NearbyDonorProjection> projections;

        if (cityId != null) {
            if (lat != null && lng != null) {
                if (lat < -90.0 || lat > 90.0) {
                    throw new BadRequestException("Latitude must be between -90 and 90 degrees");
                }
                if (lng < -180.0 || lng > 180.0) {
                    throw new BadRequestException("Longitude must be between -180 and 180 degrees");
                }
                projections = userRepository.findNearbyDonorsByCity(
                        compatibleGroups, lat, lng, radiusKm, eligibleBefore, cityId, excludedId
                );
            } else {
                City city = cityRepository.findById(cityId).orElse(null);
                if (city != null && city.getLatitude() != null && city.getLongitude() != null) {
                    projections = userRepository.findNearbyDonorsByCity(
                            compatibleGroups, city.getLatitude(), city.getLongitude(), radiusKm, eligibleBefore, cityId, excludedId
                    );
                } else {
                    projections = userRepository.findDonorsByCity(compatibleGroups, cityId, eligibleBefore, excludedId);
                }
            }
        } else {
            if (lat == null || lng == null) {
                throw new BadRequestException("Latitude and longitude are required when cityId is not specified");
            }
            if (lat < -90.0 || lat > 90.0) {
                throw new BadRequestException("Latitude must be between -90 and 90 degrees");
            }
            if (lng < -180.0 || lng > 180.0) {
                throw new BadRequestException("Longitude must be between -180 and 180 degrees");
            }
            projections = userRepository.findNearbyDonors(
                    compatibleGroups,
                    lat,
                    lng,
                    radiusKm,
                    eligibleBefore,
                    excludedId
            );
        }

        return projections.stream()
                .map(this::toDonorResponseDto)
                .toList();
    }

    /**
     * Finds compatible, eligible donors within radiusKm of coordinates,
     * optionally filtered by cityId.
     */
    @Transactional(readOnly = true)
    public List<DonorResponseDto> findCompatibleDonors(
            BloodGroup recipientBloodGroup,
            Double lat,
            Double lng,
            double radiusKm,
            Long cityId
    ) {
        return findCompatibleDonors(recipientBloodGroup, lat, lng, radiusKm, cityId, null);
    }

    /**
     * Finds compatible, eligible donors within radiusKm of coordinates (default radius search).
     */
    @Transactional(readOnly = true)
    public List<DonorResponseDto> findCompatibleDonors(
            BloodGroup recipientBloodGroup,
            double lat,
            double lng,
            double radiusKm
    ) {
        return findCompatibleDonors(recipientBloodGroup, lat, lng, radiusKm, null);
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
                .build();
    }
}
