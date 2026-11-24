package com.lifedrop.services.enums;

/**
 * Booking lifecycle: PENDING -> ACCEPTED | REJECTED | CANCELLED | EXPIRED, ACCEPTED -> COMPLETED | CANCELLED.
 */
public enum BookingStatus {
    PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED, COMPLETED;

    /** Phone number and address of the other party are shared only in these states. */
    public boolean sharesContact() {
        return this == ACCEPTED || this == COMPLETED;
    }
}
