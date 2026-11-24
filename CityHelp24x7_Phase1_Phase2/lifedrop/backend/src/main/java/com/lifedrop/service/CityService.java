package com.lifedrop.service;

import com.lifedrop.dto.CityResponse;
import com.lifedrop.repository.CityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing supported cities in City Help 24x7.
 */
@Service
public class CityService {

    private final CityRepository cityRepository;

    public CityService(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    /**
     * Retrieves all active cities ordered by sortOrder ASC, then name ASC.
     */
    @Transactional(readOnly = true)
    public List<CityResponse> getActiveCities() {
        return cityRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(CityResponse::fromEntity)
                .toList();
    }
}

