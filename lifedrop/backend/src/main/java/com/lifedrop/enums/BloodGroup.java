package com.lifedrop.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * Standard blood groups with display labels, JSON serialization,
 * and clinical donor-recipient compatibility rules.
 */
@Getter
public enum BloodGroup {
    A_POSITIVE("A+"),
    A_NEGATIVE("A-"),
    B_POSITIVE("B+"),
    B_NEGATIVE("B-"),
    AB_POSITIVE("AB+"),
    AB_NEGATIVE("AB-"),
    O_POSITIVE("O+"),
    O_NEGATIVE("O-");

    private final String label;

    BloodGroup(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    /**
     * Resolves a BloodGroup from display label (e.g., "A+", "o-") or enum name ("A_POSITIVE").
     */
    @JsonCreator
    public static BloodGroup fromLabel(String label) {
        if (label == null || label.trim().isEmpty()) {
            throw new IllegalArgumentException("Blood group cannot be null or empty");
        }
        String cleaned = label.trim().toUpperCase().replace(" ", "");
        for (BloodGroup group : values()) {
            if (group.label.equalsIgnoreCase(cleaned) || group.name().equalsIgnoreCase(cleaned)) {
                return group;
            }
        }
        throw new IllegalArgumentException("Unknown blood group: '" + label + "'. Valid values are: " +
                Arrays.toString(Arrays.stream(values()).map(BloodGroup::getLabel).toArray()));
    }

    /**
     * Returns the set of donor blood groups compatible with this recipient blood group.
     */
    public Set<BloodGroup> getCompatibleDonorGroups() {
        return switch (this) {
            case O_NEGATIVE -> EnumSet.of(O_NEGATIVE);
            case O_POSITIVE -> EnumSet.of(O_NEGATIVE, O_POSITIVE);
            case A_NEGATIVE -> EnumSet.of(O_NEGATIVE, A_NEGATIVE);
            case A_POSITIVE -> EnumSet.of(O_NEGATIVE, O_POSITIVE, A_NEGATIVE, A_POSITIVE);
            case B_NEGATIVE -> EnumSet.of(O_NEGATIVE, B_NEGATIVE);
            case B_POSITIVE -> EnumSet.of(O_NEGATIVE, O_POSITIVE, B_NEGATIVE, B_POSITIVE);
            case AB_NEGATIVE -> EnumSet.of(O_NEGATIVE, A_NEGATIVE, B_NEGATIVE, AB_NEGATIVE);
            case AB_POSITIVE -> EnumSet.allOf(BloodGroup.class);
        };
    }

    @Override
    public String toString() {
        return label;
    }
}
