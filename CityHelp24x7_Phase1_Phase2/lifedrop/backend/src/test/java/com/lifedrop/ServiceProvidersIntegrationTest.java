package com.lifedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifedrop.config.FeatureProperties;
import com.lifedrop.dto.LoginRequest;
import com.lifedrop.entity.City;
import com.lifedrop.entity.User;
import com.lifedrop.enums.Role;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.repository.NotificationRepository;
import com.lifedrop.repository.ReportRepository;
import com.lifedrop.repository.RequestResponseRepository;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.services.entity.Booking;
import com.lifedrop.services.entity.ServiceCategory;
import com.lifedrop.services.entity.ServiceProvider;
import com.lifedrop.services.enums.BookingStatus;
import com.lifedrop.services.enums.VerificationStatus;
import com.lifedrop.services.repository.BookingRepository;
import com.lifedrop.services.repository.ServiceCategoryRepository;
import com.lifedrop.services.repository.ServiceProviderRepository;
import com.lifedrop.services.repository.ServiceReportRepository;
import com.lifedrop.services.repository.ServiceReviewRepository;
import com.lifedrop.services.service.BookingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ServiceProvidersIntegrationTest {

    private static final String PWD = "Password@123";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private FeatureProperties features;
    @Autowired private CityRepository cityRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ReportRepository reportRepository;
    @Autowired private RequestResponseRepository requestResponseRepository;
    @Autowired private BloodRequestRepository bloodRequestRepository;
    @Autowired private ServiceCategoryRepository categoryRepository;
    @Autowired private ServiceProviderRepository providerRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private ServiceReviewRepository reviewRepository;
    @Autowired private ServiceReportRepository serviceReportRepository;
    @Autowired private BookingService bookingService;

    private boolean originalFlag;
    private City city;
    private ServiceCategory category;
    private User customer;
    private User providerUser;
    private User admin;
    private String customerToken;
    private String providerToken;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        originalFlag = features.isServices();
        features.setServices(true);

        reviewRepository.deleteAll();
        serviceReportRepository.deleteAll();
        bookingRepository.deleteAll();
        providerRepository.deleteAll();
        reportRepository.deleteAll();
        notificationRepository.deleteAll();
        requestResponseRepository.deleteAll();
        bloodRequestRepository.deleteAll();
        userRepository.deleteAll();

        city = cityRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream().findFirst().orElse(null);
        assertNotNull(city, "A city should be seeded");
        category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(ServiceCategory.builder().name("Electrician").icon("flash-outline").build()));

        String encoded = passwordEncoder.encode(PWD);
        customer = userRepository.save(user("Cust Omer", "cust@services.test", "9800000001", Role.USER, encoded));
        providerUser = userRepository.save(user("Pro Vider", "pro@services.test", "9800000002", Role.USER, encoded));
        admin = userRepository.save(user("Ad Min", "admin@services.test", "9800000003", Role.ADMIN, encoded));
        customerToken = login("cust@services.test");
        providerToken = login("pro@services.test");
        adminToken = login("admin@services.test");
    }

    @AfterEach
    void tearDown() {
        features.setServices(originalFlag);
    }

    private User user(String name, String email, String phone, Role role, String encoded) {
        return User.builder().name(name).email(email).password(encoded).phone(phone).role(role).active(true).build();
    }

    private String login(String email) throws Exception {
        LoginRequest req = LoginRequest.builder().email(email).password(PWD).build();
        MvcResult res = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("data").get("token").asText();
    }

    private Map<String, Object> providerBody(String name) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("categoryId", category.getId());
        m.put("cityId", city.getId());
        m.put("displayName", name);
        m.put("description", "Fast and reliable");
        m.put("address", "12 Secret Lane");
        m.put("phone", "9876543210");
        m.put("experienceYears", 5);
        m.put("priceFrom", 300);
        m.put("priceUnit", "VISIT");
        return m;
    }

    private Map<String, Object> bookingBody(Long providerId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("providerId", providerId);
        m.put("scheduledAt", LocalDateTime.now().plusDays(1).withNano(0).toString());
        m.put("description", "Fan not working");
        m.put("address", "Customer Home, Raipur");
        return m;
    }

    private String json(Object o) throws Exception {
        return objectMapper.writeValueAsString(o);
    }

    private ServiceProvider verifiedProvider(Long userId, String name) {
        return providerRepository.save(ServiceProvider.builder()
                .userId(userId).categoryId(category.getId()).cityId(city.getId()).displayName(name)
                .address("Private Road").phone("9000000000").verificationStatus(VerificationStatus.VERIFIED).available(true).build());
    }

    private JsonNode body(MvcResult r) throws Exception {
        return objectMapper.readTree(r.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Module answers 404 while the feature flag is off")
    void disabledFlag_returns404() throws Exception {
        features.setServices(false);
        mockMvc.perform(get("/api/services/categories").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Endpoints need authentication")
    void requiresAuth() throws Exception {
        mockMvc.perform(get("/api/services/categories")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Register -> pending -> hidden until admin verifies -> public view hides phone and address")
    void providerVerificationFlow() throws Exception {
        mockMvc.perform(post("/api/services/providers").header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(json(providerBody("Sharma Electricals"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.phone").value("9876543210"));

        mockMvc.perform(post("/api/services/providers").header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(json(providerBody("Again"))))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/services/providers").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.content", hasSize(0)));

        Long providerId = providerRepository.findByUserId(providerUser.getId()).orElseThrow().getId();

        mockMvc.perform(put("/api/admin/services/providers/" + providerId + "/verify")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/admin/services/providers/" + providerId + "/verify")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.verificationStatus").value("VERIFIED"));

        mockMvc.perform(get("/api/services/providers").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].phone").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].address").doesNotExist());

        mockMvc.perform(get("/api/services/providers/" + providerId).header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contactVisible").value(false))
                .andExpect(jsonPath("$.data.phone").doesNotExist());
    }

    @Test
    @DisplayName("Rejected profile returns to review after the provider edits it")
    void rejectedProfileResubmits() throws Exception {
        mockMvc.perform(post("/api/services/providers").header("Authorization", "Bearer " + providerToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(providerBody("Raju")))).andExpect(status().isCreated());
        Long id = providerRepository.findByUserId(providerUser.getId()).orElseThrow().getId();

        mockMvc.perform(put("/api/admin/services/providers/" + id + "/reject").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Blurry details\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"));

        mockMvc.perform(put("/api/services/providers/me").header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(json(providerBody("Raju Electric"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.verificationStatus").value("PENDING"));
    }

    @Test
    @DisplayName("Provider validation rejects a bad phone and unknown category")
    void providerValidation() throws Exception {
        Map<String, Object> bad = providerBody("X");
        bad.put("phone", "abc");
        mockMvc.perform(post("/api/services/providers").header("Authorization", "Bearer " + providerToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(bad))).andExpect(status().isBadRequest());

        Map<String, Object> bad2 = providerBody("X");
        bad2.put("categoryId", 999999);
        mockMvc.perform(post("/api/services/providers").header("Authorization", "Bearer " + providerToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(bad2))).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Full booking flow with privacy shield and review")
    void bookingFlow() throws Exception {
        ServiceProvider p = verifiedProvider(providerUser.getId(), "Sharma Electricals");

        MvcResult created = mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(json(bookingBody(p.getId()))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.contactVisible").value(false))
                .andExpect(jsonPath("$.data.otherPartyPhone").doesNotExist())
                .andReturn();
        long bookingId = body(created).get("data").get("id").asLong();

        // provider sees the request but not the customer's phone or address yet
        mockMvc.perform(get("/api/services/bookings/provider").header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].otherPartyPhone").doesNotExist())
                .andExpect(jsonPath("$.data[0].otherPartyAddress").doesNotExist());

        // a stranger cannot open it
        mockMvc.perform(get("/api/services/bookings/" + bookingId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
        // the customer cannot accept their own booking
        mockMvc.perform(put("/api/services/bookings/" + bookingId + "/accept").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/services/bookings/" + bookingId + "/accept").header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.otherPartyPhone").value("9800000001"))
                .andExpect(jsonPath("$.data.otherPartyAddress").value("Customer Home, Raipur"));

        // customer now sees the provider's contact details
        mockMvc.perform(get("/api/services/bookings/" + bookingId).header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.otherPartyPhone").value("9000000000"))
                .andExpect(jsonPath("$.data.otherPartyAddress").value("Private Road"));
        mockMvc.perform(get("/api/services/providers/" + p.getId()).header("Authorization", "Bearer " + customerToken))
                .andExpect(jsonPath("$.data.contactVisible").value(true)).andExpect(jsonPath("$.data.phone").value("9000000000"));

        // cannot review before completion
        mockMvc.perform(post("/api/services/bookings/" + bookingId + "/review").header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":5,\"comment\":\"Great\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/services/bookings/" + bookingId + "/complete").header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("COMPLETED"));

        mockMvc.perform(post("/api/services/bookings/" + bookingId + "/review").header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":4,\"comment\":\"Good work\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.rating").value(4));
        mockMvc.perform(post("/api/services/bookings/" + bookingId + "/review").header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":5}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/services/bookings/" + bookingId + "/review").header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":5}"))
                .andExpect(status().isForbidden());

        ServiceProvider reloaded = providerRepository.findById(p.getId()).orElseThrow();
        assertEquals(1, reloaded.getRatingCount());
        assertEquals(4.0, reloaded.getRatingAvg(), 0.001);

        mockMvc.perform(get("/api/services/providers/" + p.getId() + "/reviews").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @DisplayName("Reject, cancel and invalid transitions")
    void transitions() throws Exception {
        ServiceProvider p = verifiedProvider(providerUser.getId(), "Pro");

        long rejectedId = createBooking(p.getId());
        mockMvc.perform(put("/api/services/bookings/" + rejectedId + "/reject").header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"Fully booked\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.providerNote").value("Fully booked"));
        mockMvc.perform(put("/api/services/bookings/" + rejectedId + "/accept").header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isBadRequest());

        long cancelledId = createBooking(p.getId());
        mockMvc.perform(put("/api/services/bookings/" + cancelledId + "/cancel").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("CANCELLED"));
        mockMvc.perform(put("/api/services/bookings/" + cancelledId + "/cancel").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isBadRequest());

        // provider cannot cancel a still-pending booking (must reject)
        long pendingId = createBooking(p.getId());
        mockMvc.perform(put("/api/services/bookings/" + pendingId + "/cancel").header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isBadRequest());
    }

    private long createBooking(Long providerId) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(json(bookingBody(providerId))))
                .andExpect(status().isCreated()).andReturn();
        return body(r).get("data").get("id").asLong();
    }

    @Test
    @DisplayName("Booking validation: past date, own service, duplicate pending, unavailable, unverified")
    void bookingValidation() throws Exception {
        ServiceProvider p = verifiedProvider(providerUser.getId(), "Pro");

        Map<String, Object> past = bookingBody(p.getId());
        past.put("scheduledAt", LocalDateTime.now().minusHours(2).withNano(0).toString());
        mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(past))).andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + providerToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(bookingBody(p.getId())))).andExpect(status().isBadRequest());

        createBooking(p.getId());
        mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(bookingBody(p.getId())))).andExpect(status().isConflict());

        p.setAvailable(false);
        providerRepository.save(p);
        mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(bookingBody(p.getId())))).andExpect(status().isBadRequest());

        p.setAvailable(true);
        p.setVerificationStatus(VerificationStatus.PENDING);
        providerRepository.save(p);
        mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(bookingBody(p.getId())))).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("A customer can hold at most 5 pending bookings")
    void pendingCap() throws Exception {
        for (int i = 0; i < 5; i++) {
            ServiceProvider p = verifiedProvider(5000L + i, "Pro " + i);
            createBooking(p.getId());
        }
        ServiceProvider sixth = verifiedProvider(5999L, "Pro six");
        mockMvc.perform(post("/api/services/bookings").header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(json(bookingBody(sixth.getId()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Pending bookings older than 48 hours expire")
    void expiry() {
        ServiceProvider p = verifiedProvider(providerUser.getId(), "Pro");
        Booking old = bookingRepository.save(Booking.builder().providerId(p.getId()).customerId(customer.getId())
                .scheduledAt(LocalDateTime.now().plusDays(3)).description("Old").customerAddress("Addr")
                .createdAt(LocalDateTime.now().minusHours(49)).build());
        Booking fresh = bookingRepository.save(Booking.builder().providerId(p.getId()).customerId(customer.getId())
                .scheduledAt(LocalDateTime.now().plusDays(3)).description("Fresh").customerAddress("Addr").build());

        assertEquals(1, bookingService.expireOldPendingBookings());
        assertEquals(BookingStatus.EXPIRED, bookingRepository.findById(old.getId()).orElseThrow().getStatus());
        assertEquals(BookingStatus.PENDING, bookingRepository.findById(fresh.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("Three distinct reports suspend a provider automatically")
    void reportsAutoSuspend() throws Exception {
        ServiceProvider p = verifiedProvider(providerUser.getId(), "Shady");
        String encoded = passwordEncoder.encode(PWD);
        userRepository.save(user("R Two", "r2@services.test", "9800000011", Role.USER, encoded));
        userRepository.save(user("R Three", "r3@services.test", "9800000012", Role.USER, encoded));
        String[] tokens = {customerToken, login("r2@services.test"), login("r3@services.test")};

        // the provider cannot report themselves
        mockMvc.perform(post("/api/services/providers/" + p.getId() + "/report").header("Authorization", "Bearer " + providerToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"x\"}")).andExpect(status().isBadRequest());

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/services/providers/" + p.getId() + "/report").header("Authorization", "Bearer " + tokens[i])
                    .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Asked for money upfront\"}"))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(post("/api/services/providers/" + p.getId() + "/report").header("Authorization", "Bearer " + tokens[0])
                .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"again\"}")).andExpect(status().isConflict());

        assertEquals(VerificationStatus.SUSPENDED, providerRepository.findById(p.getId()).orElseThrow().getVerificationStatus());
        mockMvc.perform(get("/api/services/providers").header("Authorization", "Bearer " + customerToken))
                .andExpect(jsonPath("$.data.content", hasSize(0)));

        mockMvc.perform(put("/api/admin/services/providers/" + p.getId() + "/reinstate").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.verificationStatus").value("VERIFIED"));
    }

    @Test
    @DisplayName("Search filters by category, text and min rating and sorts by rating")
    void searchFiltersAndSort() throws Exception {
        ServiceProvider low = verifiedProvider(7001L, "Alpha Works");
        ServiceProvider high = verifiedProvider(7002L, "Zeta Works");
        high.setRatingAvg(4.8);
        high.setRatingCount(10);
        providerRepository.save(high);
        ServiceCategory other = categoryRepository.save(ServiceCategory.builder().name("Zzz Test Category").icon("x").build());
        ServiceProvider otherCat = verifiedProvider(7003L, "Other Cat");
        otherCat.setCategoryId(other.getId());
        providerRepository.save(otherCat);

        mockMvc.perform(get("/api/services/providers").param("categoryId", String.valueOf(category.getId()))
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].displayName").value("Zeta Works"));

        mockMvc.perform(get("/api/services/providers").param("q", "alpha").header("Authorization", "Bearer " + customerToken))
                .andExpect(jsonPath("$.data.content", hasSize(1)));

        mockMvc.perform(get("/api/services/providers").param("minRating", "4").header("Authorization", "Bearer " + customerToken))
                .andExpect(jsonPath("$.data.content", hasSize(1)));

        mockMvc.perform(get("/api/services/providers").param("lat", "95").param("lng", "10")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isBadRequest());
        assertNotNull(low);
    }

    @Test
    @DisplayName("Provider can turn availability off")
    void availabilityToggle() throws Exception {
        mockMvc.perform(post("/api/services/providers").header("Authorization", "Bearer " + providerToken)
                .contentType(MediaType.APPLICATION_JSON).content(json(providerBody("Pro")))).andExpect(status().isCreated());
        mockMvc.perform(put("/api/services/providers/me/availability").header("Authorization", "Bearer " + providerToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"available\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.available").value(false));
        mockMvc.perform(get("/api/services/providers/me").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNotFound());
    }
}
