package com.lifedrop.dto;

import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight safe user summary returned after authentication and profile views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummary {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private BloodGroup bloodGroup;
    private String city;
    private Boolean available;

    public static UserSummary fromUser(User user) {
        if (user == null) {
            return null;
        }
        return UserSummary.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .bloodGroup(user.getBloodGroup())
                .city(user.getCity())
                .available(user.getAvailable())
                .build();
    }
}
