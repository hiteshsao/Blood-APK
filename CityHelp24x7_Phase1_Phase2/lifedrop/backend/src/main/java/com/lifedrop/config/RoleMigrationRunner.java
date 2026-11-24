package com.lifedrop.config;

import com.lifedrop.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Idempotent startup migration that ensures all existing users with the legacy
 * DONOR role have donorEnabled=true.
 */
@Slf4j
@Component
@Order(3)
public class RoleMigrationRunner implements CommandLineRunner {

    private final UserRepository userRepository;

    public RoleMigrationRunner(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        int updatedCount = userRepository.migrateLegacyDonorsToDonorEnabled();
        if (updatedCount > 0) {
            log.info("Migrated {} legacy DONOR users to donorEnabled=true.", updatedCount);
        }
    }
}

