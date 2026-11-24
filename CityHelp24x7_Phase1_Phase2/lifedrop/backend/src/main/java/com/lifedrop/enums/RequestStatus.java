package com.lifedrop.enums;

/**
 * Status lifecycle of a BloodRequest:
 * PENDING -> ACCEPTED -> COMPLETED
 * or CANCELLED / EXPIRED.
 */
public enum RequestStatus {
    PENDING,
    ACCEPTED,
    COMPLETED,
    CANCELLED,
    EXPIRED
}
