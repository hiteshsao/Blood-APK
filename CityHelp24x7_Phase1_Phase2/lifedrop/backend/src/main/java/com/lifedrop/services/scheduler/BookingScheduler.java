package com.lifedrop.services.scheduler;

import com.lifedrop.services.service.BookingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Expires PENDING service bookings older than 48 hours, every 15 minutes. */
@Slf4j
@Component
public class BookingScheduler {

    private final BookingService bookingService;

    public BookingScheduler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedRate = 900000, initialDelay = 90000)
    public void expireOldBookings() {
        try {
            int n = bookingService.expireOldPendingBookings();
            if (n > 0) {
                log.info("Expired {} pending service bookings older than {} hours", n, BookingService.EXPIRY_HOURS);
            }
        } catch (Exception e) {
            log.error("Error while expiring old service bookings", e);
        }
    }
}
