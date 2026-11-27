package com.lifedrop.services.config;

import com.lifedrop.entity.User;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.services.entity.ServiceCategory;
import com.lifedrop.services.entity.ServiceProvider;
import com.lifedrop.services.enums.PriceUnit;
import com.lifedrop.services.enums.VerificationStatus;
import com.lifedrop.services.repository.ServiceCategoryRepository;
import com.lifedrop.services.repository.ServiceProviderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * DEV PROFILE ONLY: seeds a few VERIFIED sample service providers so the services-first Home
 * has something to show in demos. Every record is clearly marked "Sample" and uses fake phone
 * numbers; they are linked to existing demo donor accounts (one provider profile per user).
 * Runs after DevDataLoader (users) and ServiceCategorySeeder (categories). Skips if any provider exists.
 */
@Slf4j
@Component
@Profile("dev")
@Order(4)
public class DevServiceProviderSeeder implements CommandLineRunner {

    private final ServiceProviderRepository providerRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public DevServiceProviderSeeder(ServiceProviderRepository providerRepository,
                                    ServiceCategoryRepository categoryRepository,
                                    UserRepository userRepository) {
        this.providerRepository = providerRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (providerRepository.count() > 0) {
            return;
        }
        Map<String, ServiceCategory> categories = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(ServiceCategory::getName, Function.identity(), (a, b) -> a));

        // email, category, display name, experience, price, unit, rating avg, rating count, description
        Object[][] rows = {
                {"donor3@lifedrop.test", "Electrician", "Sample Rohan Electric Works", 8, 199, PriceUnit.VISIT, 4.8, 126,
                        "Wiring, switchboards, fans, inverter and MCB repair."},
                {"donor4@lifedrop.test", "Plumber", "Sample Sneha Plumbing Services", 6, 149, PriceUnit.VISIT, 4.7, 98,
                        "Leak repair, taps, tanks, bathroom fittings and drainage."},
                {"donor5@lifedrop.test", "Carpenter", "Sample Vikram Wood Craft", 12, 299, PriceUnit.VISIT, 4.9, 64,
                        "Furniture repair, door and window fixing, modular fittings."},
                {"donor6@lifedrop.test", "Housekeeping", "Sample Ananya Home Cleaning", 4, 349, PriceUnit.HOUR, 4.6, 210,
                        "Full home, kitchen and bathroom deep cleaning."},
                {"donor7@lifedrop.test", "AC Repair", "Sample Kunal Cool Care", 9, 399, PriceUnit.VISIT, 4.5, 77,
                        "AC service, gas refill, installation and uninstallation."},
                {"donor8@lifedrop.test", "Painter", "Sample Neha Paints & Decor", 7, 12, PriceUnit.FIXED, 4.4, 41,
                        "Interior and exterior painting, texture and waterproofing (price per sq ft)."}
        };

        List<ServiceProvider> providers = new ArrayList<>();
        int phoneSuffix = 1;
        for (Object[] r : rows) {
            Optional<User> user = userRepository.findByEmail((String) r[0]);
            ServiceCategory category = categories.get((String) r[1]);
            if (user.isEmpty() || category == null || user.get().getCityId() == null) {
                continue;
            }
            User u = user.get();
            providers.add(ServiceProvider.builder()
                    .userId(u.getId())
                    .categoryId(category.getId())
                    .displayName((String) r[2])
                    .description((String) r[8])
                    .cityId(u.getCityId())
                    .address("Sample address (demo data)")
                    .phone(String.format("90000000%02d", phoneSuffix++))
                    .experienceYears((Integer) r[3])
                    .priceFrom(BigDecimal.valueOf((Integer) r[4]))
                    .priceUnit((PriceUnit) r[5])
                    .latitude(u.getLatitude())
                    .longitude(u.getLongitude())
                    .available(true)
                    .verificationStatus(VerificationStatus.VERIFIED)
                    .ratingAvg((Double) r[6])
                    .ratingCount((Integer) r[7])
                    .build());
        }
        providerRepository.saveAll(providers);
        log.info("Seeded {} SAMPLE verified service providers (dev profile only)", providers.size());
    }
}
