package com.lifedrop.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Feature-flag configuration for City Help 24x7.
 * Each flag is overridable at runtime via an environment variable, e.g.
 *   FEATURE_SERVICES=true
 * so later phases can be switched on without a new app release.
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.features")
public class FeatureProperties {

    /** Phase 1 – Blood donation service (MVP, always on by default). */
    private boolean blood = true;

    /** Phase 2 – Service providers (plumbers, electricians, etc.). */
    private boolean services = false;

    /** Phase 3 – City directory of businesses and government offices. */
    private boolean directory = false;

    /** Phase 4 – Hyperlocal news feed and civic alerts. */
    private boolean news = false;

    /** Phase 5 – Local job postings and classifieds. */
    private boolean jobs = false;

    /** Phase 6 – Peer-to-peer buy &amp; sell marketplace. */
    private boolean buysell = false;
}

