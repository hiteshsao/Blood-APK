package com.lifedrop.dto;

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

    private String pushToken;
}
