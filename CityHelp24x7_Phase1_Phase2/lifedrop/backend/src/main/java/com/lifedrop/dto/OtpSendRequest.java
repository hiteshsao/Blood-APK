package com.lifedrop.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload to trigger sending an OTP to the given email address.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpSendRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a well-formed email address")
    @Schema(example = "donor1@lifedrop.test", description = "Registered user email address")
    private String email;
}
