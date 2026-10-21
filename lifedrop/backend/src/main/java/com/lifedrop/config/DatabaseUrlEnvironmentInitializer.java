package com.lifedrop.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Initializes and normalizes database connection properties for production cloud environments (Neon, Render, Supabase).
 *
 * Automatically handles:
 * 1. Raw Neon/PostgreSQL URIs (postgresql:// or postgres://) -> converts to jdbc:postgresql://
 * 2. Embedded credentials in URI (postgresql://user:pass@host:port/db) -> extracts username and password
 * 3. Both DB_URL and DATABASE_URL environment variable naming conventions
 * 4. Ensures sslmode=require is configured for cloud databases
 * 5. Preserves H2 and local database configurations without interference
 */
public class DatabaseUrlEnvironmentInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger log = LoggerFactory.getLogger(DatabaseUrlEnvironmentInitializer.class);

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();

        String rawUrl = env.getProperty("spring.datasource.url");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DB_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DATABASE_URL");
        }

        if (rawUrl == null || rawUrl.isBlank()) {
            return;
        }

        // Ignore H2 in-memory test databases
        if (rawUrl.startsWith("jdbc:h2:")) {
            return;
        }

        Map<String, Object> overrideProps = new HashMap<>();
        String normalizedJdbcUrl = rawUrl.trim();
        String extractedUser = null;
        String extractedPass = null;

        // Check if raw URI format (postgresql:// or postgres://)
        if (normalizedJdbcUrl.startsWith("postgres://") || normalizedJdbcUrl.startsWith("postgresql://")) {
            try {
                String cleanUriStr = normalizedJdbcUrl.startsWith("postgres://")
                        ? "http://" + normalizedJdbcUrl.substring("postgres://".length())
                        : "http://" + normalizedJdbcUrl.substring("postgresql://".length());

                URI uri = new URI(cleanUriStr);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && !userInfo.isBlank()) {
                    if (userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        extractedUser = parts[0];
                        extractedPass = parts[1];
                    } else {
                        extractedUser = userInfo;
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath(); // /dbname
                String query = uri.getQuery();

                StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path);

                if (query != null && !query.isBlank()) {
                    jdbc.append("?").append(query);
                    if (!query.contains("sslmode=")) {
                        jdbc.append("&sslmode=require");
                    }
                } else {
                    jdbc.append("?sslmode=require");
                }

                normalizedJdbcUrl = jdbc.toString();
                log.info("Normalized raw database URI to standard JDBC format: {}",
                        normalizedJdbcUrl.replaceAll(":[^/@]+@", ":****@"));
            } catch (Exception e) {
                log.warn("Could not parse database URI as URI structure, prepending jdbc: prefix: {}", e.getMessage());
                if (normalizedJdbcUrl.startsWith("postgres://")) {
                    normalizedJdbcUrl = "jdbc:postgresql://" + normalizedJdbcUrl.substring("postgres://".length());
                } else {
                    normalizedJdbcUrl = "jdbc:postgresql://" + normalizedJdbcUrl.substring("postgresql://".length());
                }
            }
        } else if (normalizedJdbcUrl.startsWith("jdbc:postgresql://")) {
            // Ensure sslmode=require for cloud PostgreSQL if not localhost
            if (!normalizedJdbcUrl.contains("localhost") && !normalizedJdbcUrl.contains("127.0.0.1") && !normalizedJdbcUrl.contains("sslmode=")) {
                normalizedJdbcUrl += (normalizedJdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
            }
        }

        overrideProps.put("spring.datasource.url", normalizedJdbcUrl);

        String currentUser = env.getProperty("spring.datasource.username");
        if ((currentUser == null || currentUser.isBlank()) && extractedUser != null) {
            overrideProps.put("spring.datasource.username", extractedUser);
        }

        String currentPass = env.getProperty("spring.datasource.password");
        if ((currentPass == null || currentPass.isBlank()) && extractedPass != null) {
            overrideProps.put("spring.datasource.password", extractedPass);
        }

        if (!overrideProps.isEmpty()) {
            env.getPropertySources().addFirst(new MapPropertySource("cloudDatabaseUrlOverrides", overrideProps));
        }
    }
}
