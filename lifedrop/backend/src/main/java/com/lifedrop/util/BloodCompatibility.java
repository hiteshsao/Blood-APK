package com.lifedrop.util;

import com.lifedrop.enums.BloodGroup;

import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Utility determining donor-to-recipient blood compatibility according to clinical immunohematology rules.
 */
public final class BloodCompatibility {

    private static final Map<BloodGroup, List<BloodGroup>> COMPATIBILITY_MAP = new EnumMap<>(BloodGroup.class);

    static {
        // A+ receives from: A+, A-, O+, O-
        COMPATIBILITY_MAP.put(BloodGroup.A_POSITIVE, List.of(
                BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE
        ));

        // A- receives from: A-, O-
        COMPATIBILITY_MAP.put(BloodGroup.A_NEGATIVE, List.of(
                BloodGroup.A_NEGATIVE, BloodGroup.O_NEGATIVE
        ));

        // B+ receives from: B+, B-, O+, O-
        COMPATIBILITY_MAP.put(BloodGroup.B_POSITIVE, List.of(
                BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE
        ));

        // B- receives from: B-, O-
        COMPATIBILITY_MAP.put(BloodGroup.B_NEGATIVE, List.of(
                BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE
        ));

        // AB+ receives from: all 8 groups (Universal Recipient)
        COMPATIBILITY_MAP.put(BloodGroup.AB_POSITIVE, List.of(
                BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE,
                BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE,
                BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE,
                BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE
        ));

        // AB- receives from: AB-, A-, B-, O-
        COMPATIBILITY_MAP.put(BloodGroup.AB_NEGATIVE, List.of(
                BloodGroup.AB_NEGATIVE, BloodGroup.A_NEGATIVE, BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE
        ));

        // O+ receives from: O+, O-
        COMPATIBILITY_MAP.put(BloodGroup.O_POSITIVE, List.of(
                BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE
        ));

        // O- receives from: O- only (Universal Donor)
        COMPATIBILITY_MAP.put(BloodGroup.O_NEGATIVE, List.of(
                BloodGroup.O_NEGATIVE
        ));
    }

    private BloodCompatibility() {
    }

    /**
     * Given the RECIPIENT blood group, returns the list of compatible DONOR blood groups.
     */
    public static List<BloodGroup> getCompatibleDonors(BloodGroup recipientGroup) {
        if (recipientGroup == null) {
            return Collections.emptyList();
        }
        return COMPATIBILITY_MAP.getOrDefault(recipientGroup, Collections.emptyList());
    }

    /**
     * Given the RECIPIENT blood group, returns the list of compatible DONOR enum names as strings for SQL queries.
     */
    public static List<String> getCompatibleDonorNames(BloodGroup recipientGroup) {
        return getCompatibleDonors(recipientGroup).stream()
                .map(Enum::name)
                .toList();
    }

    /**
     * Returns true if donor blood group can donate to recipient blood group.
     */
    public static boolean isCompatible(BloodGroup donorGroup, BloodGroup recipientGroup) {
        if (donorGroup == null || recipientGroup == null) {
            return false;
        }
        return getCompatibleDonors(recipientGroup).contains(donorGroup);
    }
}
