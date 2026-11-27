package com.lifedrop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response returned after successfully reporting a blood request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponseDto {

    private Long reportId;
    private Long requestId;
    private String reason;
    private long totalReports;
    private boolean requestCancelled;
    private String message;
    private LocalDateTime reportedAt;
}
