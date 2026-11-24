package com.lifedrop.controller;

import com.lifedrop.config.FeatureProperties;
import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.AppConfigResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoint that returns the runtime feature-flag state.
 * The mobile app calls this on startup to decide which phase tabs/flows to render.
 * No authentication required — added to permitAll in SecurityConfig.
 */
@RestController
@RequestMapping("/api/app")
@Tag(name = "App Config", description = "Runtime configuration and feature flags")
public class AppConfigController {

    private final FeatureProperties features;
    private final String appName;
    private final String minAppVersion;

    public AppConfigController(
            FeatureProperties features,
            @Value("${app.name:MyCityZone}") String appName,
            @Value("${app.min-app-version:1.0.0}") String minAppVersion
    ) {
        this.features = features;
        this.appName = appName;
        this.minAppVersion = minAppVersion;
    }

    /**
     * Returns the current app name, minimum required client version, and all
     * per-phase feature flags. Safe to call without a JWT token.
     */
    @GetMapping("/config")
    @Operation(summary = "Get runtime app configuration and feature flags")
    public ApiResponse<AppConfigResponse> getConfig() {
        AppConfigResponse body = AppConfigResponse.builder()
                .appName(appName)
                .minAppVersion(minAppVersion)
                .features(AppConfigResponse.Features.builder()
                        .blood(features.isBlood())
                        .services(features.isServices())
                        .directory(features.isDirectory())
                        .news(features.isNews())
                        .jobs(features.isJobs())
                        .buysell(features.isBuysell())
                        .build())
                .build();
        return ApiResponse.success("App configuration loaded", body);
    }
}

