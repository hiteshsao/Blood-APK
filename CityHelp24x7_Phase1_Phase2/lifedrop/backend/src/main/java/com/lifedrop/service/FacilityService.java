package com.lifedrop.service;

import com.lifedrop.dto.FacilityRequest;
import com.lifedrop.dto.FacilityResponse;
import com.lifedrop.dto.PageResponse;
import com.lifedrop.entity.Facility;
import com.lifedrop.enums.FacilityType;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.exception.ResourceNotFoundException;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.repository.FacilityRepository;
import com.lifedrop.util.DistanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Read-only directory of hospitals and blood banks, plus admin maintenance.
 * Information only: no accounts, no inventory, no commercial fees.
 */
@Service
public class FacilityService {

    private static final double MAX_RADIUS_KM = 500.0;

    private final FacilityRepository facilityRepository;
    private final CityRepository cityRepository;

    public FacilityService(FacilityRepository facilityRepository, CityRepository cityRepository) {
        this.facilityRepository = facilityRepository;
        this.cityRepository = cityRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<FacilityResponse> search(
            FacilityType type,
            Long cityId,
            Double lat,
            Double lng,
            Double radiusKm,
            String q,
            Boolean open24x7,
            int page,
            int size
    ) {
        boolean hasPoint = lat != null && lng != null;
        if (hasPoint) {
            if (lat < -90.0 || lat > 90.0) {
                throw new BadRequestException("Latitude must be between -90 and 90 degrees");
            }
            if (lng < -180.0 || lng > 180.0) {
                throw new BadRequestException("Longitude must be between -180 and 180 degrees");
            }
        }
        if (radiusKm != null && (radiusKm <= 0.0 || radiusKm > MAX_RADIUS_KM)) {
            throw new BadRequestException("radiusKm must be greater than 0 and at most " + (int) MAX_RADIUS_KM);
        }

        String needle = q == null ? "" : q.trim().toLowerCase();
        List<FacilityResponse> results = new ArrayList<>();

        for (Facility f : facilityRepository.findByActiveTrue()) {
            if (type != null && f.getType() != type) {
                continue;
            }
            if (cityId != null && !cityId.equals(f.getCityId())) {
                continue;
            }
            if (Boolean.TRUE.equals(open24x7) && !Boolean.TRUE.equals(f.getOpen24x7())) {
                continue;
            }
            if (!needle.isEmpty()) {
                String haystack = ((f.getName() == null ? "" : f.getName()) + " "
                        + (f.getAddress() == null ? "" : f.getAddress())).toLowerCase();
                if (!haystack.contains(needle)) {
                    continue;
                }
            }

            Double distance = null;
            if (hasPoint && f.getLatitude() != null && f.getLongitude() != null) {
                distance = DistanceCalculator.roundToOneDecimal(
                        DistanceCalculator.calculateDistance(lat, lng, f.getLatitude(), f.getLongitude()));
            }
            if (hasPoint && radiusKm != null && (distance == null || distance > radiusKm)) {
                continue;
            }
            results.add(FacilityResponse.fromEntity(f, distance));
        }

        Comparator<FacilityResponse> byName = Comparator.comparing(FacilityResponse::getName, String.CASE_INSENSITIVE_ORDER);
        if (hasPoint) {
            Comparator<FacilityResponse> byDistance = Comparator.comparing(
                    FacilityResponse::getDistanceKm,
                    Comparator.nullsLast(Comparator.<Double>naturalOrder()));
            results.sort(byDistance.thenComparing(byName));
        } else {
            results.sort(byName);
        }

        return PageResponse.of(results, page, size);
    }

    @Transactional(readOnly = true)
    public FacilityResponse getById(Long id) {
        Facility f = facilityRepository.findById(id)
                .filter(x -> Boolean.TRUE.equals(x.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));
        return FacilityResponse.fromEntity(f, null);
    }

    // ─── Admin ───

    @Transactional
    public FacilityResponse create(FacilityRequest request) {
        requireCity(request.getCityId());
        Facility f = Facility.builder()
                .type(request.getType())
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .phone(trimOrNull(request.getPhone()))
                .emergencyPhone(trimOrNull(request.getEmergencyPhone()))
                .cityId(request.getCityId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .open24x7(Boolean.TRUE.equals(request.getOpen24x7()))
                .notes(trimOrNull(request.getNotes()))
                .verified(Boolean.TRUE.equals(request.getVerified()))
                .active(request.getActive() == null || request.getActive())
                .build();
        return FacilityResponse.fromEntity(facilityRepository.save(f), null);
    }

    @Transactional
    public FacilityResponse update(Long id, FacilityRequest request) {
        Facility f = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));
        requireCity(request.getCityId());

        f.setType(request.getType());
        f.setName(request.getName().trim());
        f.setAddress(request.getAddress().trim());
        f.setPhone(trimOrNull(request.getPhone()));
        f.setEmergencyPhone(trimOrNull(request.getEmergencyPhone()));
        f.setCityId(request.getCityId());
        f.setLatitude(request.getLatitude());
        f.setLongitude(request.getLongitude());
        f.setOpen24x7(Boolean.TRUE.equals(request.getOpen24x7()));
        f.setNotes(trimOrNull(request.getNotes()));
        if (request.getVerified() != null) {
            f.setVerified(request.getVerified());
        }
        if (request.getActive() != null) {
            f.setActive(request.getActive());
        }
        return FacilityResponse.fromEntity(facilityRepository.save(f), null);
    }

    /** Soft delete: the row stays, but it disappears from every public list. */
    @Transactional
    public void softDelete(Long id) {
        Facility f = facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility", "id", id));
        f.setActive(false);
        facilityRepository.save(f);
    }

    private void requireCity(Long cityId) {
        if (cityId == null || !cityRepository.existsById(cityId)) {
            throw new ResourceNotFoundException("City", "id", cityId);
        }
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
