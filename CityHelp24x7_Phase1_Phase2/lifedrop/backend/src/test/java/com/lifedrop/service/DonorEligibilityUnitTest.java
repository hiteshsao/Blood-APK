package com.lifedrop.service;

import com.lifedrop.dto.EligibilityResponse;
import com.lifedrop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 3 Unit tests specifically verifying the donor donation gap eligibility calculation logic.
 */
class DonorEligibilityUnitTest {

    private DonorService donorService;
    private final LocalDate today = LocalDate.of(2026, 10, 16);

    @BeforeEach
    void setUp() {
        UserRepository mockUserRepository = Mockito.mock(UserRepository.class);
        // Standard 90-day donation gap
        donorService = new DonorService(mockUserRepository, 90);
    }

    @Test
    @DisplayName("Unit Test 1: Donor has never donated (lastDonatedDate is null) -> Immediately eligible with 0 days remaining")
    void testEligibilityWhenNeverDonated() {
        EligibilityResponse response = donorService.calculateEligibility(null, today);

        assertTrue(response.isEligible(), "Donor who never donated must be eligible");
        assertNull(response.getLastDonatedDate());
        assertEquals(today, response.getNextEligibleDate());
        assertEquals(0L, response.getDaysRemaining());
    }

    @Test
    @DisplayName("Unit Test 2: Donor donated 30 days ago (< 90 days gap) -> Ineligible with 60 days remaining")
    void testEligibilityWhenDonatedRecently() {
        LocalDate lastDonated = today.minusDays(30);
        EligibilityResponse response = donorService.calculateEligibility(lastDonated, today);

        assertFalse(response.isEligible(), "Donor within 90 days of donation must NOT be eligible");
        assertEquals(lastDonated, response.getLastDonatedDate());
        assertEquals(lastDonated.plusDays(90), response.getNextEligibleDate());
        assertEquals(60L, response.getDaysRemaining(), "Should have exactly 60 days remaining");
    }

    @Test
    @DisplayName("Unit Test 3: Donor donated 100 days ago (>= 90 days gap) -> Eligible with 0 days remaining")
    void testEligibilityWhenDonatedOver90DaysAgo() {
        LocalDate lastDonated = today.minusDays(100);
        EligibilityResponse response = donorService.calculateEligibility(lastDonated, today);

        assertTrue(response.isEligible(), "Donor who donated >= 90 days ago must be eligible");
        assertEquals(lastDonated, response.getLastDonatedDate());
        assertEquals(lastDonated.plusDays(90), response.getNextEligibleDate());
        assertEquals(0L, response.getDaysRemaining(), "Days remaining must be 0 for eligible donors");
    }
}
