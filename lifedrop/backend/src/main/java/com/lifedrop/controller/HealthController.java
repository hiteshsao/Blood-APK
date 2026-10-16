package com.lifedrop.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health Check", description = "System health check endpoints")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Check backend service health status")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "LifeDrop API",
                "timestamp", Instant.now().toString()
        ));
    }
}
