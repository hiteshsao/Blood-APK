package com.lifedrop.services.config;

import com.lifedrop.services.entity.ServiceCategory;
import com.lifedrop.services.repository.ServiceCategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/** Seeds the default service categories when the table is empty. The first six are featured on the home screen. */
@Slf4j
@Component
@Order(3)
public class ServiceCategorySeeder implements CommandLineRunner {

    private final ServiceCategoryRepository repository;

    public ServiceCategorySeeder(ServiceCategoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }
        String[][] rows = {
                {"Electrician", "flash-outline", "true"},
                {"Plumber", "water-outline", "true"},
                {"Carpenter", "hammer-outline", "true"},
                {"Housekeeping", "home-outline", "true"},
                {"AC Repair", "snow-outline", "true"},
                {"Painter", "color-palette-outline", "true"},
                {"Car Wash", "car-outline", "false"},
                {"Mechanic", "build-outline", "false"},
                {"Pest Control", "bug-outline", "false"},
                {"Appliance Repair", "tv-outline", "false"},
                {"Mobile Repair", "phone-portrait-outline", "false"},
                {"Other", "ellipsis-horizontal-circle-outline", "false"}
        };
        List<ServiceCategory> list = new ArrayList<>();
        for (int i = 0; i < rows.length; i++) {
            list.add(ServiceCategory.builder()
                    .name(rows[i][0]).icon(rows[i][1]).featured(Boolean.parseBoolean(rows[i][2]))
                    .sortOrder(i).active(true).build());
        }
        repository.saveAll(list);
        log.info("Seeded {} service categories", list.size());
    }
}
