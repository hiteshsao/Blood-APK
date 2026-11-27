package com.lifedrop.services.dto;

import jakarta.validation.constraints.Size;

/** Optional note sent with reject / cancel / complete. */
public record BookingNoteRequest(@Size(max = 500, message = "Note must be at most 500 characters") String note) {
}
