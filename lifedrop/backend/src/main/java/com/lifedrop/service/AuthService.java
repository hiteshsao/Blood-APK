package com.lifedrop.service;

import com.lifedrop.dto.AuthResponse;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.dto.RegisterRequest;
import com.lifedrop.dto.UserSummary;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.exception.ResourceNotFoundException;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling registration, login, and profile lookups.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email is already registered: " + normalizedEmail);
        }

        // Donor-specific validations
        if (request.getRole() == Role.DONOR) {
            if (request.getBloodGroup() == null) {
                throw new BadRequestException("Blood group is required for donors");
            }
            if (request.getAge() == null || request.getAge() < 18 || request.getAge() > 65) {
                throw new BadRequestException("Donor must be between 18 and 65 years old");
            }
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone().trim())
                .role(request.getRole())
                .bloodGroup(request.getBloodGroup())
                .age(request.getAge())
                .gender(request.getGender())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .available(true)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole(), savedUser.getId());

        return AuthResponse.builder()
                .token(token)
                .user(UserSummary.fromUser(savedUser))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BadRequestException("Account has been deactivated. Please contact support.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .user(UserSummary.fromUser(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserSummary getCurrentUser(String email) {
        if (email == null) {
            throw new BadCredentialsException("Authentication required");
        }
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return UserSummary.fromUser(user);
    }
}
