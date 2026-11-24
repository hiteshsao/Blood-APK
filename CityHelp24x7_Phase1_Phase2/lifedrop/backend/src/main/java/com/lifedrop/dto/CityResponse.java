package com.lifedrop.dto;

import com.lifedrop.entity.City;
import lombok.Builder;
import lombok.Data;

/**
 * Public representation of a City — safe to return unauthenticated.
 */
@Data
@Builder
public class CityResponse {

    private Long id;
    private String name;
    private String state;
    private Double latitude;
    private Double longitude;
    private Integer sortOrder;

    public static CityResponse fromEntity(City city) {
        return CityResponse.builder()
                .id(city.getId())
                .name(city.getName())
                .state(city.getState())
                .latitude(city.getLatitude())
                .longitude(city.getLongitude())
                .sortOrder(city.getSortOrder())
                .build();
    }
}

