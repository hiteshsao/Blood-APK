package com.lifedrop.util;

/**
 * Utility for calculating the great-circle distance between two geographic coordinates
 * on Earth using the Haversine formula.
 */
public final class DistanceCalculator {

    public static final double EARTH_RADIUS_KM = 6371.0;

    private DistanceCalculator() {
    }

    /**
     * Calculates the great-circle distance in kilometers between two lat/lng coordinates.
     *
     * @param lat1 Latitude of point 1 in degrees
     * @param lon1 Longitude of point 1 in degrees
     * @param lat2 Latitude of point 2 in degrees
     * @param lon2 Longitude of point 2 in degrees
     * @return Distance in kilometers
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        if (lat1 == lat2 && lon1 == lon2) {
            return 0.0;
        }

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double radLat1 = Math.toRadians(lat1);
        double radLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
                Math.cos(radLat1) * Math.cos(radLat2) *
                Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);

        // Clamp 'a' to [0.0, 1.0] to prevent NaN due to floating-point rounding errors
        a = Math.max(0.0, Math.min(1.0, a));

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Rounds a distance in kilometers to 1 decimal place (e.g., 4.234 -> 4.2).
     */
    public static double roundToOneDecimal(double distanceKm) {
        return Math.round(distanceKm * 10.0) / 10.0;
    }
}
