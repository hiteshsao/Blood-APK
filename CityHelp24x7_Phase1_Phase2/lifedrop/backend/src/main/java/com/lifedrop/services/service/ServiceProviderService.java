package com.lifedrop.services.service;

import com.lifedrop.config.FeatureProperties;
import com.lifedrop.dto.PageResponse;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.exception.ConflictException;
import com.lifedrop.exception.ForbiddenException;
import com.lifedrop.exception.ResourceNotFoundException;
import com.lifedrop.repository.CityRepository;
import com.lifedrop.services.dto.CategoryResponse;
import com.lifedrop.services.dto.ProviderRequest;
import com.lifedrop.services.dto.ProviderResponse;
import com.lifedrop.services.dto.ReviewResponse;
import com.lifedrop.services.entity.ServiceCategory;
import com.lifedrop.services.entity.ServiceProvider;
import com.lifedrop.services.entity.ServiceReport;
import com.lifedrop.services.enums.BookingStatus;
import com.lifedrop.services.enums.VerificationStatus;
import com.lifedrop.services.repository.BookingRepository;
import com.lifedrop.services.repository.ServiceCategoryRepository;
import com.lifedrop.services.repository.ServiceProviderRepository;
import com.lifedrop.services.repository.ServiceReportRepository;
import com.lifedrop.services.repository.ServiceReviewRepository;
import com.lifedrop.util.DistanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Provider profiles, discovery, reports and admin verification.
 * Public discovery only returns VERIFIED providers and never exposes phone or address.
 */
@Service
public class ServiceProviderService {

    public static final int REPORTS_TO_SUSPEND = 3;
    private static final double MAX_RADIUS_KM = 500.0;

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceProviderRepository providerRepository;
    private final BookingRepository bookingRepository;
    private final ServiceReviewRepository reviewRepository;
    private final ServiceReportRepository reportRepository;
    private final CityRepository cityRepository;
    private final ServiceNotifier notifier;
    private final FeatureProperties features;

    public ServiceProviderService(ServiceCategoryRepository categoryRepository,
                                  ServiceProviderRepository providerRepository,
                                  BookingRepository bookingRepository,
                                  ServiceReviewRepository reviewRepository,
                                  ServiceReportRepository reportRepository,
                                  CityRepository cityRepository,
                                  ServiceNotifier notifier,
                                  FeatureProperties features) {
        this.categoryRepository = categoryRepository;
        this.providerRepository = providerRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.reportRepository = reportRepository;
        this.cityRepository = cityRepository;
        this.notifier = notifier;
        this.features = features;
    }

    /** The whole module answers 404 while FEATURE_SERVICES is off. */
    public void requireEnabled() {
        if (!features.isServices()) {
            throw new ResourceNotFoundException("Services module is not enabled");
        }
    }

    // ---------------------------------------------------------------- categories

    @Transactional(readOnly = true)
    public List<CategoryResponse> categories() {
        requireEnabled();
        List<CategoryResponse> out = new ArrayList<>();
        for (ServiceCategory c : categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc()) {
            out.add(CategoryResponse.from(c));
        }
        return out;
    }

    // ---------------------------------------------------------------- provider self service

    @Transactional
    public ProviderResponse register(Long userId, ProviderRequest req) {
        requireEnabled();
        if (providerRepository.existsByUserId(userId)) {
            throw new ConflictException("You already have a provider profile");
        }
        validateRefs(req);
        ServiceProvider p = ServiceProvider.builder()
                .userId(userId)
                .verificationStatus(VerificationStatus.PENDING)
                .available(true)
                .build();
        apply(p, req);
        p = providerRepository.save(p);
        return toResponse(p, null, true);
    }

    @Transactional(readOnly = true)
    public ProviderResponse me(Long userId) {
        requireEnabled();
        return toResponse(findByUser(userId), null, true);
    }

    /**
     * Update own profile. A rejected profile goes back to PENDING for another review.
     * A suspended provider cannot edit.
     */
    @Transactional
    public ProviderResponse updateMe(Long userId, ProviderRequest req) {
        requireEnabled();
        ServiceProvider p = findByUser(userId);
        if (p.getVerificationStatus() == VerificationStatus.SUSPENDED) {
            throw new ForbiddenException("Your profile is suspended. Contact support.");
        }
        validateRefs(req);
        apply(p, req);
        if (p.getVerificationStatus() == VerificationStatus.REJECTED) {
            p.setVerificationStatus(VerificationStatus.PENDING);
            p.setStatusReason(null);
        }
        return toResponse(providerRepository.save(p), null, true);
    }

    @Transactional
    public ProviderResponse setAvailability(Long userId, boolean available) {
        requireEnabled();
        ServiceProvider p = findByUser(userId);
        p.setAvailable(available);
        return toResponse(providerRepository.save(p), null, true);
    }

    // ---------------------------------------------------------------- discovery

    @Transactional(readOnly = true)
    public PageResponse<ProviderResponse> search(Long categoryId, Long cityId, Double lat, Double lng, Double radiusKm,
                                                 String q, Double minRating, String sort, int page, int size) {
        requireEnabled();
        boolean hasLocation = lat != null && lng != null;
        if ((lat == null) != (lng == null)) {
            throw new BadRequestException("Both lat and lng are required for distance search");
        }
        if (hasLocation && (lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
            throw new BadRequestException("Invalid latitude or longitude");
        }
        if (radiusKm != null && (radiusKm <= 0 || radiusKm > MAX_RADIUS_KM)) {
            throw new BadRequestException("radiusKm must be between 0 and " + (int) MAX_RADIUS_KM);
        }
        Map<Long, String> names = categoryNames();
        String needle = q == null ? "" : q.trim().toLowerCase();

        List<Object[]> rows = new ArrayList<>(); // [provider, distance]
        for (ServiceProvider p : providerRepository.findByVerificationStatus(VerificationStatus.VERIFIED)) {
            if (categoryId != null && !categoryId.equals(p.getCategoryId())) continue;
            if (cityId != null && !cityId.equals(p.getCityId())) continue;
            if (minRating != null && p.getRatingAvg() < minRating) continue;
            if (!needle.isEmpty()) {
                String hay = (p.getDisplayName() + " " + (p.getDescription() == null ? "" : p.getDescription())
                        + " " + names.getOrDefault(p.getCategoryId(), "")).toLowerCase();
                if (!hay.contains(needle)) continue;
            }
            Double distance = null;
            if (hasLocation && p.getLatitude() != null && p.getLongitude() != null) {
                distance = DistanceCalculator.roundToOneDecimal(
                        DistanceCalculator.calculateDistance(lat, lng, p.getLatitude(), p.getLongitude()));
            }
            if (radiusKm != null) {
                if (!hasLocation || distance == null || distance > radiusKm) continue;
            }
            rows.add(new Object[]{p, distance});
        }

        Comparator<Object[]> byRating = Comparator
                .comparingDouble((Object[] r) -> ((ServiceProvider) r[0]).getRatingAvg()).reversed()
                .thenComparing(Comparator.comparingInt((Object[] r) -> ((ServiceProvider) r[0]).getRatingCount()).reversed())
                .thenComparing(r -> ((ServiceProvider) r[0]).getDisplayName().toLowerCase());
        Comparator<Object[]> cmp;
        if ("distance".equalsIgnoreCase(sort) && hasLocation) {
            cmp = Comparator.comparing((Object[] r) -> (Double) r[1], Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(byRating);
        } else if ("price".equalsIgnoreCase(sort)) {
            cmp = Comparator.comparing((Object[] r) -> ((ServiceProvider) r[0]).getPriceFrom(),
                    Comparator.nullsLast(Comparator.naturalOrder())).thenComparing(byRating);
        } else {
            cmp = byRating;
        }
        rows.sort(cmp);

        List<ProviderResponse> out = new ArrayList<>();
        for (Object[] r : rows) {
            ServiceProvider p = (ServiceProvider) r[0];
            out.add(ProviderResponse.from(p, names.get(p.getCategoryId()), (Double) r[1], false));
        }
        return PageResponse.of(out, page, size);
    }

    /** Public detail: only VERIFIED providers (or the owner). Contact details only after an accepted booking. */
    @Transactional(readOnly = true)
    public ProviderResponse getById(Long viewerId, Long providerId) {
        requireEnabled();
        ServiceProvider p = providerRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
        boolean owner = p.getUserId().equals(viewerId);
        if (!owner && p.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResourceNotFoundException("Provider not found");
        }
        boolean visible = owner || bookingRepository.existsByCustomerIdAndProviderIdAndStatusIn(
                viewerId, providerId, List.of(BookingStatus.ACCEPTED, BookingStatus.COMPLETED));
        return toResponse(p, null, visible);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> reviews(Long providerId) {
        requireEnabled();
        ServiceProvider p = providerRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
        if (p.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResourceNotFoundException("Provider not found");
        }
        List<ReviewResponse> out = new ArrayList<>();
        reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId).forEach(r -> out.add(ReviewResponse.from(r)));
        return out;
    }

    // ---------------------------------------------------------------- reports

    @Transactional
    public void report(Long reporterId, Long providerId, String reason) {
        requireEnabled();
        ServiceProvider p = providerRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
        if (p.getUserId().equals(reporterId)) {
            throw new BadRequestException("You cannot report yourself");
        }
        if (reportRepository.existsByProviderIdAndReporterId(providerId, reporterId)) {
            throw new ConflictException("You have already reported this provider");
        }
        reportRepository.save(ServiceReport.builder().providerId(providerId).reporterId(reporterId).reason(reason.trim()).build());
        long count = reportRepository.countByProviderId(providerId);
        if (count >= REPORTS_TO_SUSPEND && p.getVerificationStatus() == VerificationStatus.VERIFIED) {
            p.setVerificationStatus(VerificationStatus.SUSPENDED);
            p.setStatusReason("Suspended automatically after " + count + " reports");
            providerRepository.save(p);
            notifier.notify(p.getUserId(), "PROVIDER_SUSPENDED", "Profile suspended",
                    "Your provider profile was suspended after multiple reports. Contact support.", p.getId());
        }
    }

    // ---------------------------------------------------------------- admin

    @Transactional(readOnly = true)
    public List<ProviderResponse> adminList(VerificationStatus status) {
        requireEnabled();
        Map<Long, String> names = categoryNames();
        List<ServiceProvider> all = status == null
                ? providerRepository.findAllByOrderByCreatedAtDesc()
                : providerRepository.findByVerificationStatus(status);
        List<ProviderResponse> out = new ArrayList<>();
        for (ServiceProvider p : all) {
            out.add(ProviderResponse.from(p, names.get(p.getCategoryId()), null, true));
        }
        return out;
    }

    @Transactional
    public ProviderResponse verify(Long providerId) {
        ServiceProvider p = adminProvider(providerId);
        p.setVerificationStatus(VerificationStatus.VERIFIED);
        p.setStatusReason(null);
        providerRepository.save(p);
        notifier.notify(p.getUserId(), "PROVIDER_VERIFIED", "You are verified",
                "Your provider profile is live. Customers can now find and book you.", p.getId());
        return toResponse(p, null, true);
    }

    @Transactional
    public ProviderResponse reject(Long providerId, String reason) {
        ServiceProvider p = adminProvider(providerId);
        p.setVerificationStatus(VerificationStatus.REJECTED);
        p.setStatusReason(reason == null || reason.isBlank() ? "Not approved" : reason.trim());
        providerRepository.save(p);
        notifier.notify(p.getUserId(), "PROVIDER_REJECTED", "Profile not approved",
                "Reason: " + p.getStatusReason() + ". Update your profile and submit again.", p.getId());
        return toResponse(p, null, true);
    }

    @Transactional
    public ProviderResponse suspend(Long providerId, String reason) {
        ServiceProvider p = adminProvider(providerId);
        p.setVerificationStatus(VerificationStatus.SUSPENDED);
        p.setStatusReason(reason == null || reason.isBlank() ? "Suspended by admin" : reason.trim());
        providerRepository.save(p);
        notifier.notify(p.getUserId(), "PROVIDER_SUSPENDED", "Profile suspended",
                "Reason: " + p.getStatusReason(), p.getId());
        return toResponse(p, null, true);
    }

    /** Lifts a suspension (back to VERIFIED) and clears earlier reports so auto-suspend does not re-trigger at once. */
    @Transactional
    public ProviderResponse reinstate(Long providerId) {
        ServiceProvider p = adminProvider(providerId);
        if (p.getVerificationStatus() != VerificationStatus.SUSPENDED) {
            throw new BadRequestException("Only suspended providers can be reinstated");
        }
        p.setVerificationStatus(VerificationStatus.VERIFIED);
        p.setStatusReason(null);
        providerRepository.save(p);
        reportRepository.deleteAll(reportRepository.findAll().stream()
                .filter(r -> r.getProviderId().equals(providerId)).toList());
        notifier.notify(p.getUserId(), "PROVIDER_VERIFIED", "Profile reinstated",
                "Your provider profile is active again.", p.getId());
        return toResponse(p, null, true);
    }

    // ---------------------------------------------------------------- helpers

    private ServiceProvider adminProvider(Long id) {
        requireEnabled();
        return providerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
    }

    private ServiceProvider findByUser(Long userId) {
        return providerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("You have no provider profile yet"));
    }

    private void validateRefs(ProviderRequest req) {
        ServiceCategory c = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new BadRequestException("Unknown service category"));
        if (!c.isActive()) {
            throw new BadRequestException("This category is not available");
        }
        if (!cityRepository.existsById(req.cityId())) {
            throw new BadRequestException("Unknown city");
        }
        if ((req.latitude() == null) != (req.longitude() == null)) {
            throw new BadRequestException("Provide both latitude and longitude, or neither");
        }
        if (req.latitude() != null && (req.latitude() < -90 || req.latitude() > 90
                || req.longitude() < -180 || req.longitude() > 180)) {
            throw new BadRequestException("Invalid latitude or longitude");
        }
    }

    private void apply(ServiceProvider p, ProviderRequest req) {
        p.setCategoryId(req.categoryId());
        p.setCityId(req.cityId());
        p.setDisplayName(req.displayName().trim());
        p.setDescription(req.description() == null ? null : req.description().trim());
        p.setAddress(req.address().trim());
        p.setPhone(req.phone().trim());
        p.setExperienceYears(req.experienceYears());
        p.setPriceFrom(req.priceFrom());
        p.setPriceUnit(req.priceUnit());
        p.setLatitude(req.latitude());
        p.setLongitude(req.longitude());
    }

    private Map<Long, String> categoryNames() {
        Map<Long, String> names = new HashMap<>();
        categoryRepository.findAll().forEach(c -> names.put(c.getId(), c.getName()));
        return names;
    }

    private ProviderResponse toResponse(ServiceProvider p, Double distance, boolean contactVisible) {
        String name = categoryRepository.findById(p.getCategoryId()).map(ServiceCategory::getName).orElse(null);
        return ProviderResponse.from(p, name, distance, contactVisible);
    }
}
