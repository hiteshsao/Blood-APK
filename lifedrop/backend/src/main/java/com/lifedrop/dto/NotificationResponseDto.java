package com.lifedrop.dto;

import com.lifedrop.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * In-app notification representation returned by notification endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDto {

    private Long id;
    private String title;
    private String body;
    private String type;
    private Long relatedRequestId;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponseDto fromEntity(Notification entity) {
        if (entity == null) {
            return null;
        }
        return NotificationResponseDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .body(entity.getBody())
                .type(entity.getType())
                .relatedRequestId(entity.getRelatedRequestId())
                .read(entity.isRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
