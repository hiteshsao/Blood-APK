package com.lifedrop.dto;

import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registration payload for Donors and Recipients.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be a valid 10-digit number")
    private String phone;

    @NotNull(message = "Role is required (DONOR or RECIPIENT)")
    private Role role;

    // Required when role == DONOR (validated in service)
    private BloodGroup bloodGroup;

    // Donor must be 18 to 65 (validated in service)
    private Integer age;

    private String gender;

    private String city;

    private Double latitude;

    private Double longitude;
}
