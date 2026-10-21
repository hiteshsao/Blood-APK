package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.AuthResponse;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.dto.OtpSendRequest;
import com.lifedrop.dto.OtpVerifyRequest;
import com.lifedrop.dto.RegisterRequest;
import com.lifedrop.dto.UserSummary;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.AuthService;
import com.lifedrop.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
 * Controller handling user registration, authentication, passwordless OTP, and current profile retrieval.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for registration, login, email OTP, and current user profile")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
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

    @PostMapping("/otp/send")
    @Operation(summary = "Send passwordless login OTP to email")
    public ResponseEntity<ApiResponse<Void>> sendOtp(
            @Valid @RequestBody OtpSendRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = extractClientIp(servletRequest);
        String message = otpService.sendOtp(request.getEmail(), clientIp);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify OTP and login (returns JWT token and user summary)")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = extractClientIp(servletRequest);
        AuthResponse response = otpService.verifyOtp(request.getEmail(), request.getOtp(), clientIp);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
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
