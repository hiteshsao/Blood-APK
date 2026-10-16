package com.lifedrop.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Payload sent to the Expo Push API (https://exp.host/--/api/v2/push/send).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExpoPushMessageDto {

    /**
     * The recipient Expo push token (e.g. ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]).
     */
    private String to;

    /**
     * Title displayed in the push alert.
     */
    private String title;

    /**
     * Notification body text.
     */
    private String body;

    /**
     * Sound played on arrival (defaults to "default").
     */
    @Builder.Default
    private String sound = "default";

    /**
     * Custom JSON metadata payload received by client apps ({requestId, type}).
     */
    private Map<String, Object> data;

    /**
     * Delivery priority: "default" or "high". For URGENT requests, set to "high".
     */
    private String priority;

    /**
     * Android notification channel ID: for URGENT requests, set to "urgent".
     */
    private String channelId;
}
