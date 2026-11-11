package com.lifedrop;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for GET /api/app/config.
 * Verifies response shape, default flag values, and that the endpoint is public.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AppConfigControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/app/config returns 200 without a JWT token (public endpoint)")
    void config_isPublic() throws Exception {
        mockMvc.perform(get("/api/app/config"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/app/config response has correct top-level shape")
    void config_hasCorrectShape() throws Exception {
        mockMvc.perform(get("/api/app/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.appName").isString())
                .andExpect(jsonPath("$.data.minAppVersion").isString())
                .andExpect(jsonPath("$.data.features").isMap());
    }

    @Test
    @DisplayName("GET /api/app/config returns appName 'City Help 24x7'")
    void config_appNameIsCorrect() throws Exception {
        mockMvc.perform(get("/api/app/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appName").value("City Help 24x7"));
    }

    @Test
    @DisplayName("GET /api/app/config: blood=true by default")
    void config_bloodEnabledByDefault() throws Exception {
        mockMvc.perform(get("/api/app/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.features.blood").value(true));
    }

    @Test
    @DisplayName("GET /api/app/config: services=false by default")
    void config_servicesDisabledByDefault() throws Exception {
        mockMvc.perform(get("/api/app/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.features.services").value(false));
    }

    @Test
    @DisplayName("GET /api/app/config: all Phase 3-6 flags are false by default")
    void config_laterPhasesFalseByDefault() throws Exception {
        mockMvc.perform(get("/api/app/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.features.directory").value(false))
                .andExpect(jsonPath("$.data.features.news").value(false))
                .andExpect(jsonPath("$.data.features.jobs").value(false))
                .andExpect(jsonPath("$.data.features.buysell").value(false));
    }
}

