package com.lifedrop.dto;

import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Full profile payload returned to the authenticated user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private Boolean donorEnabled;
    private BloodGroup bloodGroup;
    private Integer age;
    private String gender;
    private String city;
    /** Structured city id — null for users who haven't selected a city yet. */
    private Long cityId;
    /** Structured city name resolved from cityRef — null when cityId is null. */
    private String cityName;
    private Double latitude;
    private Double longitude;
    private Boolean available;
    private LocalDate lastDonatedDate;
    private String pushToken;
    private Boolean active;
    private LocalDateTime createdAt;

    public static UserProfileResponse fromUser(User user) {
        if (user == null) {
            return null;
        }
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .donorEnabled(Boolean.TRUE.equals(user.getDonorEnabled()))
                .bloodGroup(user.getBloodGroup())
                .age(user.getAge())
                .gender(user.getGender())
                .city(user.getCity())
                .cityId(user.getCityRef() != null ? user.getCityRef().getId() : null)
                .cityName(user.getCityRef() != null ? user.getCityRef().getName() : null)
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .available(user.getAvailable())
                .lastDonatedDate(user.getLastDonatedDate())
                .pushToken(user.getPushToken())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
