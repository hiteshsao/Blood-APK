package com.lifedrop.config;

import com.lifedrop.entity.City;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Dev-profile data seeder.
 * Seeds 12 donors across Indore (within 15 km of center 22.7196, 75.8577) and 2 recipients.
 * Password for all accounts: Password@123
 * Only executes when the users table is completely empty.
 */
@Slf4j
@Component
@Profile("dev")
@Order(2)
public class DevDataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CityRepository cityRepository;

    public DevDataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder, CityRepository cityRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.cityRepository = cityRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("ℹ️ Users table already contains data. Skipping dev demo data seeding.");
            return;
        }

        log.info("🌱 Seeding demo donors and recipients for 'dev' profile in Indore, MP...");
        String encodedPassword = passwordEncoder.encode("Password@123");

        // 12 Donors around Indore (Center: 22.7196, 75.8577 - spread within 15 km)
        List<User> donors = List.of(
                User.builder()
                        .name("Aarav Sharma")
                        .email("donor1@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000001")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.A_POSITIVE)
                        .age(26)
                        .gender("MALE")
                        .city("Indore")
                        .latitude(22.7244)
                        .longitude(75.8839)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(LocalDate.now().minusDays(120))
                        .build(),
                User.builder()
                        .name("Pooja Patel")
                        .email("donor2@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000002")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.A_POSITIVE)
                        .age(24)
                        .gender("FEMALE")
                        .city("Indore")
                        .latitude(22.7533)
                        .longitude(75.8937)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build(),
                User.builder()
                        .name("Rohan Verma")
                        .email("donor3@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000003")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.O_POSITIVE)
                        .age(29)
                        .gender("MALE")
                        .city("Indore")
                        .latitude(22.6868)
                        .longitude(75.8648)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(LocalDate.now().minusDays(95))
                        .build(),
                User.builder()
                        .name("Sneha Jain")
                        .email("donor4@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000004")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.O_NEGATIVE)
                        .age(27)
                        .gender("FEMALE")
                        .city("Indore")
                        .latitude(22.7012)
                        .longitude(75.8345)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build(),
                User.builder()
                        .name("Vikram Singh")
                        .email("donor5@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000005")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.B_POSITIVE)
                        .age(31)
                        .gender("MALE")
                        .city("Indore")
                        .latitude(22.6685)
                        .longitude(75.8290)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build(),
                User.builder()
                        .name("Ananya Mishra")
                        .email("donor6@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000006")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.B_NEGATIVE)
                        .age(25)
                        .gender("FEMALE")
                        .city("Indore")
                        .latitude(22.7165)
                        .longitude(75.9082)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build(),
                User.builder()
                        .name("Kunal Ghosh")
                        .email("donor7@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000007")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.AB_POSITIVE)
                        .age(34)
                        .gender("MALE")
                        .city("Indore")
                        .latitude(22.7380)
                        .longitude(75.9120)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(LocalDate.now().minusDays(105))
                        .build(),
                User.builder()
                        .name("Neha Gupta")
                        .email("donor8@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000008")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.AB_NEGATIVE)
                        .age(28)
                        .gender("FEMALE")
                        .city("Indore")
                        .latitude(22.6950)
                        .longitude(75.8250)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build(),
                User.builder()
                        .name("Deepak Yadav")
                        .email("donor9@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000009")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.A_NEGATIVE)
                        .age(30)
                        .gender("MALE")
                        .city("Indore")
                        .latitude(22.7650)
                        .longitude(75.8750)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build(),
                User.builder()
                        .name("Priyanka Tiwari")
                        .email("donor10@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000010")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.O_POSITIVE)
                        .age(23)
                        .gender("FEMALE")
                        .city("Indore")
                        .latitude(22.7180)
                        .longitude(75.8820)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(LocalDate.now().minusDays(150))
                        .build(),
                User.builder()
                        .name("Amit Saxena")
                        .email("donor11@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000011")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.A_POSITIVE)
                        .age(32)
                        .gender("MALE")
                        .city("Indore")
                        .latitude(22.6288)
                        .longitude(75.8052)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build(),
                User.builder()
                        .name("Kavita Rao")
                        .email("donor12@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9800000012")
                        .role(Role.USER)
                        .donorEnabled(true)
                        .bloodGroup(BloodGroup.B_POSITIVE)
                        .age(26)
                        .gender("FEMALE")
                        .city("Indore")
                        .latitude(22.7750)
                        .longitude(75.8450)
                        .available(true)
                        .active(true)
                        .lastDonatedDate(null)
                        .build()
        );

        // 2 Recipients in Indore (donorEnabled=false)
        List<User> recipients = List.of(
                User.builder()
                        .name("Rajesh Recipient")
                        .email("recipient1@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9811111111")
                        .role(Role.USER)
                        .donorEnabled(false)
                        .bloodGroup(BloodGroup.A_POSITIVE)
                        .city("Indore")
                        .latitude(22.7196)
                        .longitude(75.8577)
                        .available(false)
                        .active(true)
                        .build(),
                User.builder()
                        .name("Sunita Recipient")
                        .email("recipient2@lifedrop.test")
                        .password(encodedPassword)
                        .phone("9822222222")
                        .role(Role.USER)
                        .donorEnabled(false)
                        .bloodGroup(BloodGroup.O_POSITIVE)
                        .city("Indore")
                        .latitude(22.7480)
                        .longitude(75.8900)
                        .available(false)
                        .active(true)
                        .build()
        );

        User admin = User.builder()
                .name("City Help Admin")
                .email("admin@lifedrop.test")
                .password(encodedPassword)
                .phone("9899999999")
                .role(Role.ADMIN)
                .donorEnabled(false)
                .city("Bhopal")
                .available(false)
                .active(true)
                .build();

        City bhopal = cityRepository.findAll().stream()
                .filter(c -> "Bhopal".equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> cityRepository.save(City.builder()
                        .name("Bhopal")
                        .state("Madhya Pradesh")
                        .latitude(23.2599)
                        .longitude(77.4126)
                        .active(true)
                        .sortOrder(100)
                        .build()));

        donors.forEach(d -> d.setCityRef(bhopal));
        recipients.forEach(r -> r.setCityRef(bhopal));
        admin.setCityRef(bhopal);

        userRepository.saveAll(donors);
        userRepository.saveAll(recipients);
        userRepository.save(admin);

        log.info("Seed data inserted: {} users (including admin)", donors.size() + recipients.size() + 1);
    }
}
