package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.AuthResponse;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.dto.RegisterRequest;
import com.lifedrop.dto.UserSummary;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller handling user registration, authentication, and current profile retrieval.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for registration, login, and current user profile")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new Donor or Recipient")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    @Operation(
            summary = "Get current authenticated user profile",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<UserSummary>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        String email = principal != null ? principal.getEmail() : null;
        UserSummary summary = authService.getCurrentUser(email);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", summary));
    }
}
