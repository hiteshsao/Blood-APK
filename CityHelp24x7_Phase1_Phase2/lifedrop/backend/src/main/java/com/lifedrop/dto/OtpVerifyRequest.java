package com.lifedrop.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload to verify an email OTP code.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerifyRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a well-formed email address")
    @Schema(example = "donor1@lifedrop.test", description = "Registered user email address")
    private String email;

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "\\d{6}", message = "OTP must be exactly 6 digits")
    @Schema(example = "123456", description = "6-digit verification code")
    private String otp;
}
