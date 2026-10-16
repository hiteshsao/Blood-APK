package com.lifedrop.util;

import com.lifedrop.enums.BloodGroup;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests verifying donor-recipient compatibility rules for EVERY blood group.
 */
class BloodCompatibilityUnitTest {

    @Test
    @DisplayName("1. Recipient A+ can receive blood from A+, A-, O+, O-")
    void testRecipientAPositive() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.A_POSITIVE);
        assertEquals(4, donors.size());
        assertTrue(donors.containsAll(List.of(
                BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE,
                BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE
        )));
        assertFalse(donors.contains(BloodGroup.B_POSITIVE));
        assertFalse(donors.contains(BloodGroup.AB_POSITIVE));
    }

    @Test
    @DisplayName("2. Recipient A- can receive blood from A-, O-")
    void testRecipientANegative() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.A_NEGATIVE);
        assertEquals(2, donors.size());
        assertTrue(donors.containsAll(List.of(BloodGroup.A_NEGATIVE, BloodGroup.O_NEGATIVE)));
        assertFalse(donors.contains(BloodGroup.A_POSITIVE));
    }

    @Test
    @DisplayName("3. Recipient B+ can receive blood from B+, B-, O+, O-")
    void testRecipientBPositive() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.B_POSITIVE);
        assertEquals(4, donors.size());
        assertTrue(donors.containsAll(List.of(
                BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE,
                BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE
        )));
        assertFalse(donors.contains(BloodGroup.A_POSITIVE));
    }

    @Test
    @DisplayName("4. Recipient B- can receive blood from B-, O-")
    void testRecipientBNegative() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.B_NEGATIVE);
        assertEquals(2, donors.size());
        assertTrue(donors.containsAll(List.of(BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE)));
        assertFalse(donors.contains(BloodGroup.B_POSITIVE));
    }

    @Test
    @DisplayName("5. Recipient AB+ can receive blood from all 8 blood groups (Universal Recipient)")
    void testRecipientABPositive() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.AB_POSITIVE);
        assertEquals(8, donors.size());
        assertTrue(donors.containsAll(List.of(BloodGroup.values())));
    }

    @Test
    @DisplayName("6. Recipient AB- can receive blood from AB-, A-, B-, O-")
    void testRecipientABNegative() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.AB_NEGATIVE);
        assertEquals(4, donors.size());
        assertTrue(donors.containsAll(List.of(
                BloodGroup.AB_NEGATIVE, BloodGroup.A_NEGATIVE,
                BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE
        )));
        assertFalse(donors.contains(BloodGroup.AB_POSITIVE));
        assertFalse(donors.contains(BloodGroup.A_POSITIVE));
    }

    @Test
    @DisplayName("7. Recipient O+ can receive blood from O+, O-")
    void testRecipientOPositive() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.O_POSITIVE);
        assertEquals(2, donors.size());
        assertTrue(donors.containsAll(List.of(BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE)));
        assertFalse(donors.contains(BloodGroup.A_POSITIVE));
        assertFalse(donors.contains(BloodGroup.B_POSITIVE));
    }

    @Test
    @DisplayName("8. Recipient O- can receive blood from O- only")
    void testRecipientONegative() {
        List<BloodGroup> donors = BloodCompatibility.getCompatibleDonors(BloodGroup.O_NEGATIVE);
        assertEquals(1, donors.size());
        assertEquals(List.of(BloodGroup.O_NEGATIVE), donors);
    }
}
