package com.lifedrop.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for updating user device push notification token.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePushTokenRequest {

    @NotBlank(message = "Push token cannot be blank")
    private String pushToken;
}
