package com.lifedrop.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests verifying Haversine distance calculations and rounding.
 */
class DistanceCalculatorUnitTest {

    @Test
    @DisplayName("1. Distance between identical coordinates is exactly 0.0 km")
    void testSamePointDistanceIsZero() {
        double dist = DistanceCalculator.calculateDistance(28.6139, 77.2090, 28.6139, 77.2090);
        assertEquals(0.0, dist, 0.0001);
    }

    @Test
    @DisplayName("2. Distance across 1 degree of latitude is approximately 111.19 km")
    void testOneDegreeLatitudeDistance() {
        double dist = DistanceCalculator.calculateDistance(0.0, 0.0, 1.0, 0.0);
        // 1 deg latitude ~ 111.195 km
        assertEquals(111.2, dist, 0.5);
    }

    @Test
    @DisplayName("3. Known geographic distance between Mumbai and Pune is ~118-121 km")
    void testKnownDistanceMumbaiToPune() {
        // Mumbai: 19.0760 N, 72.8777 E
        // Pune: 18.5204 N, 73.8567 E
        double dist = DistanceCalculator.calculateDistance(19.0760, 72.8777, 18.5204, 73.8567);
        assertTrue(dist >= 115.0 && dist <= 125.0, "Mumbai-Pune distance should be approx 119 km, actual: " + dist);
    }

    @Test
    @DisplayName("4. Rounding helper rounds to 1 decimal place correctly")
    void testRoundToOneDecimal() {
        assertEquals(4.2, DistanceCalculator.roundToOneDecimal(4.234));
        assertEquals(7.9, DistanceCalculator.roundToOneDecimal(7.891));
        assertEquals(10.0, DistanceCalculator.roundToOneDecimal(9.99));
        assertEquals(0.0, DistanceCalculator.roundToOneDecimal(0.04));
    }
}
