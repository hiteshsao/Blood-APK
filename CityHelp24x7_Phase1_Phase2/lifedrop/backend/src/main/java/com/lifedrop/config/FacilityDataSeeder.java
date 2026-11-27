package com.lifedrop.config;

import com.lifedrop.entity.City;
import com.lifedrop.entity.Facility;
import com.lifedrop.enums.FacilityType;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.repository.FacilityRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Seeds clearly-labelled SAMPLE hospitals and blood banks so the directory screens can be demoed.
 * Off by default (app.facilities.seed-sample=false); the dev profile turns it on.
 * Every sample name starts with "Sample " and uses an obviously fake phone number.
 * Real institutions are entered later by an admin via /api/admin/facilities.
 */
@Slf4j
@Component
@Order(2)
public class FacilityDataSeeder implements CommandLineRunner {

    private static final String FAKE_PHONE = "0000000000";

    private final FacilityRepository facilityRepository;
    private final CityRepository cityRepository;
    private final boolean seedSample;

    public FacilityDataSeeder(
            FacilityRepository facilityRepository,
            CityRepository cityRepository,
            @Value("${app.facilities.seed-sample:false}") boolean seedSample
    ) {
        this.facilityRepository = facilityRepository;
        this.cityRepository = cityRepository;
        this.seedSample = seedSample;
    }

    @Override
    public void run(String... args) {
        if (!seedSample) {
            return;
        }
        if (facilityRepository.count() > 0) {
            log.info("Facilities table already has data. Skipping sample seeding.");
            return;
        }

        List<Facility> rows = new ArrayList<>();
        for (City city : cityRepository.findByActiveTrueOrderBySortOrderAscNameAsc()) {
            if (city.getLatitude() == null || city.getLongitude() == null) {
                continue;
            }
            for (int i = 1; i <= 5; i++) {
                rows.add(sample(city, FacilityType.HOSPITAL, "Sample Hospital " + i, i, i <= 2));
            }
            for (int i = 1; i <= 4; i++) {
                rows.add(sample(city, FacilityType.BLOOD_BANK, "Sample Blood Bank " + i, i + 5, i == 1));
            }
        }
        facilityRepository.saveAll(rows);
        log.info("Seeded {} SAMPLE facilities (replace with real entries via the admin API).", rows.size());
    }

    private Facility sample(City city, FacilityType type, String baseName, int slot, boolean open24x7) {
        // Deterministic spread of roughly 1 to 7 km around the city centre.
        double dLat = ((slot % 3) - 1) * 0.012 + slot * 0.003;
        double dLng = ((slot % 4) - 1.5) * 0.012;
        return Facility.builder()
                .type(type)
                .name(baseName + " - " + city.getName())
                .address("Sample address " + slot + ", " + city.getName() + ", " + city.getState())
                .phone(FAKE_PHONE)
                .emergencyPhone(open24x7 ? FAKE_PHONE : null)
                .cityId(city.getId())
                .latitude(city.getLatitude() + dLat)
                .longitude(city.getLongitude() + dLng)
                .open24x7(open24x7)
                .notes("Sample data - replace with real entries via admin.")
                .verified(false)
                .active(true)
                .build();
    }
}
