package com.lifedrop.config;

import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Production admin bootstrap. Admins can never self-register. If the environment variable
 * ADMIN_BOOTSTRAP_EMAIL names an EXISTING user, that user is promoted to ADMIN on startup.
 * Register the account normally in the app first, then set the variable and restart the server.
 */
@Slf4j
@Component
@Order(4)
public class AdminBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final String bootstrapEmail;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            @Value("${app.admin.bootstrap-email:}") String bootstrapEmail
    ) {
        this.userRepository = userRepository;
        this.bootstrapEmail = bootstrapEmail;
    }

    @Override
    public void run(String... args) {
        if (bootstrapEmail == null || bootstrapEmail.isBlank()) {
            return;
        }
        if (!promote(bootstrapEmail)) {
            log.warn("ADMIN_BOOTSTRAP_EMAIL is set but no user with that email exists yet. Register it in the app first.");
        }
    }

    /**
     * Promotes the given existing user to ADMIN.
     *
     * @return true when the user exists (and is now ADMIN), false when no such user exists
     */
    @Transactional
    public boolean promote(String email) {
        Optional<User> found = userRepository.findByEmail(email.trim().toLowerCase());
        if (found.isEmpty()) {
            return false;
        }
        User user = found.get();
        if (user.getRole() != Role.ADMIN) {
            user.setRole(Role.ADMIN);
            userRepository.save(user);
            log.info("Promoted user id={} to ADMIN via ADMIN_BOOTSTRAP_EMAIL.", user.getId());
        }
        return true;
    }
}
