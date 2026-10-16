package com.lifedrop.service;

import com.lifedrop.dto.EligibilityResponse;
import com.lifedrop.dto.UserProfileResponse;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.exception.ResourceNotFoundException;
import com.lifedrop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Service managing donor availability and donation gap eligibility.
 */
@Service
public class DonorService {

    private final UserRepository userRepository;
    private final int donationGapDays;

    public DonorService(
            UserRepository userRepository,
            @Value("${donation.gap-days:90}") int donationGapDays
    ) {
        this.userRepository = userRepository;
        this.donationGapDays = donationGapDays;
    }

    public int getDonationGapDays() {
        return donationGapDays;
    }

    /**
     * Pure calculation logic for donor eligibility based on donation gap interval.
     */
    public EligibilityResponse calculateEligibility(LocalDate lastDonatedDate, LocalDate currentDate) {
        if (currentDate == null) {
            currentDate = LocalDate.now();
        }

        if (lastDonatedDate == null) {
            return EligibilityResponse.builder()
                    .eligible(true)
                    .lastDonatedDate(null)
                    .nextEligibleDate(currentDate)
                    .daysRemaining(0L)
                    .build();
        }

        LocalDate nextEligibleDate = lastDonatedDate.plusDays(donationGapDays);
        long daysRemaining = ChronoUnit.DAYS.between(currentDate, nextEligibleDate);

        if (daysRemaining <= 0) {
            return EligibilityResponse.builder()
                    .eligible(true)
                    .lastDonatedDate(lastDonatedDate)
                    .nextEligibleDate(nextEligibleDate)
                    .daysRemaining(0L)
                    .build();
        } else {
            return EligibilityResponse.builder()
                    .eligible(false)
                    .lastDonatedDate(lastDonatedDate)
                    .nextEligibleDate(nextEligibleDate)
                    .daysRemaining(daysRemaining)
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public EligibilityResponse checkEligibility(Long donorId) {
        User donor = getDonorById(donorId);
        return calculateEligibility(donor.getLastDonatedDate(), LocalDate.now());
    }

    @Transactional
    public UserProfileResponse updateAvailability(Long donorId, Boolean available) {
        if (available == null) {
            throw new BadRequestException("Availability status cannot be null");
        }

        User donor = getDonorById(donorId);

        // If trying to set availability ON, enforce eligibility rule
        if (Boolean.TRUE.equals(available)) {
            EligibilityResponse eligibility = calculateEligibility(donor.getLastDonatedDate(), LocalDate.now());
            if (!eligibility.isEligible()) {
                throw new BadRequestException(String.format(
                        "You are not eligible to turn availability ON. Next eligible date is %s (%d days remaining).",
                        eligibility.getNextEligibleDate(),
                        eligibility.getDaysRemaining()
                ));
            }
        }

        donor.setAvailable(available);
        User saved = userRepository.save(donor);
        return UserProfileResponse.fromUser(saved);
    }

    private User getDonorById(Long donorId) {
        if (donorId == null) {
            throw new BadRequestException("Donor ID cannot be null");
        }
        User user = userRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor", "id", donorId));

        if (user.getRole() != Role.DONOR) {
            throw new BadRequestException("User with ID " + donorId + " is not a DONOR");
        }
        return user;
    }
}
