package com.lifedrop.config;

import com.lifedrop.entity.City;
import com.lifedrop.repository.CityRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Startup seeder for supported cities in City Help 24x7.
 * Seeds initial Chhattisgarh cities if the cities table is empty (works in dev and prod).
 * In the dev profile, also seeds Bhopal (Madhya Pradesh) so demo data keeps working.
 */
@Slf4j
@Component
@Order(1)
public class CityDataInitializer implements CommandLineRunner {

    private final CityRepository cityRepository;
    private final Environment environment;

    public CityDataInitializer(CityRepository cityRepository, Environment environment) {
        this.cityRepository = cityRepository;
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        if (cityRepository.count() > 0) {
            log.info("ℹ️ Cities table already initialized. Skipping city seeding.");
            return;
        }

        log.info("🌱 Seeding initial cities for City Help 24x7...");
        List<City> cities = new ArrayList<>(List.of(
                City.builder()
                        .name("Raipur")
                        .state("Chhattisgarh")
                        .latitude(21.2514)
                        .longitude(81.6296)
                        .active(true)
                        .sortOrder(1)
                        .build(),
                City.builder()
                        .name("Raigarh")
                        .state("Chhattisgarh")
                        .latitude(21.8974)
                        .longitude(83.3950)
                        .active(true)
                        .sortOrder(2)
                        .build(),
                City.builder()
                        .name("Bilaspur")
                        .state("Chhattisgarh")
                        .latitude(22.0797)
                        .longitude(82.1409)
                        .active(true)
                        .sortOrder(3)
                        .build(),
                City.builder()
                        .name("Durg")
                        .state("Chhattisgarh")
                        .latitude(21.1904)
                        .longitude(81.2849)
                        .active(true)
                        .sortOrder(4)
                        .build(),
                City.builder()
                        .name("Ambikapur")
                        .state("Chhattisgarh")
                        .latitude(23.1189)
                        .longitude(83.1952)
                        .active(true)
                        .sortOrder(5)
                        .build()
        ));

        if (environment.acceptsProfiles(Profiles.of("dev"))) {
            log.info("🌱 Dev profile active: seeding Bhopal demo city...");
            cities.add(City.builder()
                    .name("Bhopal")
                    .state("Madhya Pradesh")
                    .latitude(23.2599)
                    .longitude(77.4126)
                    .active(true)
                    .sortOrder(100)
                    .build());
        }

        cityRepository.saveAll(cities);
        log.info("✅ Seeded {} cities successfully.", cities.size());
    }
}

