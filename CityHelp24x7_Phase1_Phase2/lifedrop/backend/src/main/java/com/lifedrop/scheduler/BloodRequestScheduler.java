package com.lifedrop.scheduler;

import com.lifedrop.service.BloodRequestService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for blood request maintenance.
 * Automatically marks PENDING requests older than 24 hours as EXPIRED every 15 minutes.
 */
@Slf4j
@Component
public class BloodRequestScheduler {

    private final BloodRequestService bloodRequestService;

    public BloodRequestScheduler(BloodRequestService bloodRequestService) {
        this.bloodRequestService = bloodRequestService;
    }

    /**
     * Runs every 15 minutes to expire pending blood requests that have exceeded 24 hours.
     * Fixed rate of 900,000 ms (15 minutes), with initial delay of 60 seconds after startup.
     */
    @Scheduled(fixedRate = 900000, initialDelay = 60000)
    public void expireOldBloodRequests() {
        log.debug("Running scheduled task to expire pending blood requests older than 24 hours");
        try {
            int expiredCount = bloodRequestService.expireOldPendingRequests();
            if (expiredCount > 0) {
                log.info("Expired {} pending blood requests older than 24 hours", expiredCount);
            }
        } catch (Exception e) {
            log.error("Error occurred while expiring old blood requests", e);
        }
    }
}
