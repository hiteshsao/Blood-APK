package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.NotificationResponseDto;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller for managing in-app notifications (accessible by any authenticated DONOR or RECIPIENT).
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notification Operations", description = "Endpoints for user in-app notifications and unread tracking")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get user in-app notifications (paged, newest first)")
    public ResponseEntity<ApiResponse<Page<NotificationResponseDto>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<NotificationResponseDto> result = notificationService.getUserNotifications(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(
                String.format("Retrieved %d notifications (page %d of %d)",
                        result.getNumberOfElements(), result.getNumber(), result.getTotalPages()),
                result
        ));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications for the authenticated user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Unread count retrieved",
                Map.of("unreadCount", count)
        ));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a specific notification as read")
    public ResponseEntity<ApiResponse<NotificationResponseDto>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        NotificationResponseDto updated = notificationService.markAsRead(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", updated));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all unread notifications as read for the authenticated user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        int updatedCount = notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "All notifications marked as read",
                Map.of("markedCount", updatedCount)
        ));
    }
}
