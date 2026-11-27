package com.lifedrop.enums;

/**
 * Type of an information-only directory entry (no accounts, no inventory).
 * Stored as STRING so later phases (City Directory) can append values such as CLINIC, SCHOOL, HOTEL.
 */
public enum FacilityType {
    HOSPITAL,
    BLOOD_BANK
}
