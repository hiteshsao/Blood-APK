package com.lifedrop.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Response body for GET /api/app/config.
 * Tells the mobile client which phases are currently enabled
 * and enforces a minimum app version gate.
 */
@Data
@Builder
public class AppConfigResponse {

    /** Display name of the application. */
    private String appName;

    /**
     * Minimum semantic version of the mobile app required to use this backend.
     * The mobile client should compare and show an upgrade prompt if below this.
     */
    private String minAppVersion;

    /** Per-phase feature flags. */
    private Features features;

    @Data
    @Builder
    public static class Features {
        private boolean blood;
        private boolean services;
        private boolean directory;
        private boolean news;
        private boolean jobs;
        private boolean buysell;
    }
}

