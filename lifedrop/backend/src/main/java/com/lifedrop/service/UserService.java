package com.lifedrop.service;

import com.lifedrop.dto.UpdateLocationRequest;
import com.lifedrop.dto.UpdateProfileRequest;
import com.lifedrop.dto.UpdatePushTokenRequest;
import com.lifedrop.dto.UserProfileResponse;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.exception.ResourceNotFoundException;
import com.lifedrop.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user profile, location coordinates, and push token registration.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getFullProfile(Long userId) {
        User user = getUserById(userId);
        return UserProfileResponse.fromUser(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserById(userId);

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getCity() != null) {
            user.setCity(request.getCity().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender().trim());
        }

        if (request.getAge() != null) {
            if (user.getRole() == Role.DONOR && (request.getAge() < 18 || request.getAge() > 65)) {
                throw new BadRequestException("Donor age must be between 18 and 65 years");
            }
            user.setAge(request.getAge());
        }

        if (request.getBloodGroup() != null) {
            user.setBloodGroup(request.getBloodGroup());
        }

        // Note: email and role are deliberately never modified
        User saved = userRepository.save(user);
        return UserProfileResponse.fromUser(saved);
    }

    @Transactional
    public UserProfileResponse updateLocation(Long userId, UpdateLocationRequest request) {
        User user = getUserById(userId);

        if (request.getLatitude() < -90.0 || request.getLatitude() > 90.0) {
            throw new BadRequestException("Latitude must be between -90 and 90 degrees");
        }
        if (request.getLongitude() < -180.0 || request.getLongitude() > 180.0) {
            throw new BadRequestException("Longitude must be between -180 and 180 degrees");
        }

        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());

        User saved = userRepository.save(user);
        return UserProfileResponse.fromUser(saved);
    }

    @Transactional
    public UserProfileResponse updatePushToken(Long userId, UpdatePushTokenRequest request) {
        User user = getUserById(userId);
        user.setPushToken(request != null && request.getPushToken() != null && !request.getPushToken().isBlank() ? request.getPushToken().trim() : null);

        User saved = userRepository.save(user);
        return UserProfileResponse.fromUser(saved);
    }

    /**
     * Anonymizes all personal identifiable data and deactivates the user account.
     */
    @Transactional
    public void deleteAccount(Long userId) {
        User user = getUserById(userId);
        String anonymizedId = java.util.UUID.randomUUID().toString().substring(0, 8);
        user.setName("Deleted User");
        user.setEmail("deleted_" + user.getId() + "_" + anonymizedId + "@anonymized.local");
        user.setPhone("0000000000");
        user.setPushToken(null);
        user.setLatitude(null);
        user.setLongitude(null);
        user.setActive(false);
        user.setAvailable(false);
        user.setPassword("{noop}DELETED_" + java.util.UUID.randomUUID());

        userRepository.save(user);
    }

    private User getUserById(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User ID cannot be null");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
