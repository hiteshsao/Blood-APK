package com.lifedrop.controller;

import com.lifedrop.dto.ApiResponse;
import com.lifedrop.dto.UpdateLocationRequest;
import com.lifedrop.dto.UpdateProfileRequest;
import com.lifedrop.dto.UpdatePushTokenRequest;
import com.lifedrop.dto.UserProfileResponse;
import com.lifedrop.security.UserPrincipal;
import com.lifedrop.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for managing authenticated user profile, GPS location, and push notification tokens.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "Endpoints for user profile, location, and push notification tokens")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get full profile of logged-in user")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserProfileResponse profile = userService.getFullProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Update profile (name, phone, city, age, gender, bloodGroup)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserProfileResponse updated = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @PutMapping("/location")
    @Operation(summary = "Update GPS latitude and longitude coordinates")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateLocation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateLocationRequest request
    ) {
        UserProfileResponse updated = userService.updateLocation(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Location updated successfully", updated));
    }

    @PutMapping("/push-token")
    @Operation(summary = "Register device push notification token")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updatePushToken(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePushTokenRequest request
    ) {
        UserProfileResponse updated = userService.updatePushToken(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Push token updated successfully", updated));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/me")
    @Operation(summary = "Delete and permanently anonymize authenticated user account")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(@AuthenticationPrincipal UserPrincipal principal) {
        userService.deleteAccount(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Account deleted and personal data anonymized successfully", null));
    }
}
