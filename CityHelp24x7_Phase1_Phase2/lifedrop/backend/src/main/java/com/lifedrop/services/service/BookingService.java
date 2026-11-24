package com.lifedrop.services.service;

import com.lifedrop.entity.User;
import com.lifedrop.exception.BadRequestException;
import com.lifedrop.exception.ConflictException;
import com.lifedrop.exception.ForbiddenException;
import com.lifedrop.exception.ResourceNotFoundException;
import com.lifedrop.repository.UserRepository;
import com.lifedrop.services.dto.BookingRequest;
import com.lifedrop.services.dto.BookingResponse;
import com.lifedrop.services.dto.ReviewRequest;
import com.lifedrop.services.dto.ReviewResponse;
import com.lifedrop.services.entity.Booking;
import com.lifedrop.services.entity.ServiceCategory;
import com.lifedrop.services.entity.ServiceProvider;
import com.lifedrop.services.entity.ServiceReview;
import com.lifedrop.services.enums.BookingStatus;
import com.lifedrop.services.enums.VerificationStatus;
import com.lifedrop.services.repository.BookingRepository;
import com.lifedrop.services.repository.ServiceCategoryRepository;
import com.lifedrop.services.repository.ServiceProviderRepository;
import com.lifedrop.services.repository.ServiceReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Booking state machine and privacy shield.
 * PENDING -> ACCEPTED | REJECTED | CANCELLED | EXPIRED ; ACCEPTED -> COMPLETED | CANCELLED.
 * Phone and address of the other party are only returned once the booking is ACCEPTED or COMPLETED.
 */
@Service
public class BookingService {

    public static final int MAX_PENDING_PER_CUSTOMER = 5;
    public static final int EXPIRY_HOURS = 48;

    private final BookingRepository bookingRepository;
    private final ServiceProviderRepository providerRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ServiceNotifier notifier;
    private final ServiceProviderService providerService;

    public BookingService(BookingRepository bookingRepository,
                          ServiceProviderRepository providerRepository,
                          ServiceCategoryRepository categoryRepository,
                          ServiceReviewRepository reviewRepository,
                          UserRepository userRepository,
                          ServiceNotifier notifier,
                          ServiceProviderService providerService) {
        this.bookingRepository = bookingRepository;
        this.providerRepository = providerRepository;
        this.categoryRepository = categoryRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.notifier = notifier;
        this.providerService = providerService;
    }

    // ---------------------------------------------------------------- create / list

    @Transactional
    public BookingResponse create(Long customerId, BookingRequest req) {
        providerService.requireEnabled();
        ServiceProvider provider = providerRepository.findById(req.providerId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
        if (provider.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResourceNotFoundException("Provider not found");
        }
        if (provider.getUserId().equals(customerId)) {
            throw new BadRequestException("You cannot book your own service");
        }
        if (!provider.isAvailable()) {
            throw new BadRequestException("This provider is not taking bookings right now");
        }
        if (!req.scheduledAt().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Pick a date and time in the future");
        }
        if (bookingRepository.countByCustomerIdAndStatus(customerId, BookingStatus.PENDING) >= MAX_PENDING_PER_CUSTOMER) {
            throw new BadRequestException("You can have at most " + MAX_PENDING_PER_CUSTOMER
                    + " pending bookings. Wait for replies or cancel one.");
        }
        if (bookingRepository.existsByCustomerIdAndProviderIdAndStatus(customerId, provider.getId(), BookingStatus.PENDING)) {
            throw new ConflictException("You already have a pending booking with this provider");
        }
        Booking booking = bookingRepository.save(Booking.builder()
                .providerId(provider.getId())
                .customerId(customerId)
                .status(BookingStatus.PENDING)
                .scheduledAt(req.scheduledAt())
                .description(req.description().trim())
                .customerAddress(req.address().trim())
                .build());
        User customer = user(customerId);
        notifier.notify(provider.getUserId(), "BOOKING_REQUEST", "New booking request",
                customer.getName() + " wants to book you. Open the app to accept or reject.", booking.getId());
        return toResponse(booking, provider, customerId);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> mine(Long customerId) {
        providerService.requireEnabled();
        List<BookingResponse> out = new ArrayList<>();
        for (Booking b : bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)) {
            out.add(toResponse(b, provider(b.getProviderId()), customerId));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> forProvider(Long userId) {
        providerService.requireEnabled();
        ServiceProvider p = providerRepository.findByUserId(userId).orElse(null);
        List<BookingResponse> out = new ArrayList<>();
        if (p == null) {
            return out;
        }
        for (Booking b : bookingRepository.findByProviderIdOrderByCreatedAtDesc(p.getId())) {
            out.add(toResponse(b, p, userId));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public BookingResponse get(Long viewerId, Long bookingId) {
        providerService.requireEnabled();
        Booking b = booking(bookingId);
        ServiceProvider p = provider(b.getProviderId());
        requireParty(b, p, viewerId);
        return toResponse(b, p, viewerId);
    }

    // ---------------------------------------------------------------- transitions

    @Transactional
    public BookingResponse accept(Long userId, Long bookingId) {
        providerService.requireEnabled();
        Booking b = booking(bookingId);
        ServiceProvider p = provider(b.getProviderId());
        requireProvider(p, userId);
        requireStatus(b, BookingStatus.PENDING);
        b.setStatus(BookingStatus.ACCEPTED);
        bookingRepository.save(b);
        notifier.notify(b.getCustomerId(), "BOOKING_ACCEPTED", "Booking accepted",
                p.getDisplayName() + " accepted your booking. Contact details are now visible.", b.getId());
        return toResponse(b, p, userId);
    }

    @Transactional
    public BookingResponse reject(Long userId, Long bookingId, String note) {
        providerService.requireEnabled();
        Booking b = booking(bookingId);
        ServiceProvider p = provider(b.getProviderId());
        requireProvider(p, userId);
        requireStatus(b, BookingStatus.PENDING);
        b.setStatus(BookingStatus.REJECTED);
        b.setProviderNote(clean(note));
        bookingRepository.save(b);
        notifier.notify(b.getCustomerId(), "BOOKING_REJECTED", "Booking declined",
                p.getDisplayName() + " could not take this booking. Try another provider.", b.getId());
        return toResponse(b, p, userId);
    }

    /** Customer may cancel PENDING or ACCEPTED; the provider may cancel an ACCEPTED booking. */
    @Transactional
    public BookingResponse cancel(Long userId, Long bookingId, String note) {
        providerService.requireEnabled();
        Booking b = booking(bookingId);
        ServiceProvider p = provider(b.getProviderId());
        requireParty(b, p, userId);
        boolean customer = b.getCustomerId().equals(userId);
        if (customer) {
            if (b.getStatus() != BookingStatus.PENDING && b.getStatus() != BookingStatus.ACCEPTED) {
                throw new BadRequestException("This booking can no longer be cancelled");
            }
        } else {
            requireStatus(b, BookingStatus.ACCEPTED);
            b.setProviderNote(clean(note));
        }
        b.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(b);
        Long other = customer ? p.getUserId() : b.getCustomerId();
        notifier.notify(other, "BOOKING_CANCELLED", "Booking cancelled",
                (customer ? "The customer" : p.getDisplayName()) + " cancelled the booking.", b.getId());
        return toResponse(b, p, userId);
    }

    @Transactional
    public BookingResponse complete(Long userId, Long bookingId) {
        providerService.requireEnabled();
        Booking b = booking(bookingId);
        ServiceProvider p = provider(b.getProviderId());
        requireProvider(p, userId);
        requireStatus(b, BookingStatus.ACCEPTED);
        b.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(b);
        notifier.notify(b.getCustomerId(), "BOOKING_COMPLETED", "Job completed",
                "Please rate " + p.getDisplayName() + " to help others choose.", b.getId());
        return toResponse(b, p, userId);
    }

    // ---------------------------------------------------------------- review

    @Transactional
    public ReviewResponse review(Long userId, Long bookingId, ReviewRequest req) {
        providerService.requireEnabled();
        Booking b = booking(bookingId);
        if (!b.getCustomerId().equals(userId)) {
            throw new ForbiddenException("Only the customer can review this booking");
        }
        if (b.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("You can review a booking after it is completed");
        }
        if (reviewRepository.existsByBookingId(bookingId)) {
            throw new ConflictException("You already reviewed this booking");
        }
        ServiceProvider p = provider(b.getProviderId());
        ServiceReview saved = reviewRepository.save(ServiceReview.builder()
                .bookingId(bookingId).providerId(p.getId()).customerId(userId)
                .customerName(user(userId).getName())
                .rating(req.rating())
                .comment(clean(req.comment()))
                .build());
        List<ServiceReview> all = reviewRepository.findByProviderIdOrderByCreatedAtDesc(p.getId());
        double avg = all.stream().mapToInt(ServiceReview::getRating).average().orElse(0.0);
        p.setRatingCount(all.size());
        p.setRatingAvg(Math.round(avg * 10.0) / 10.0);
        providerRepository.save(p);
        notifier.notify(p.getUserId(), "BOOKING_REVIEWED", "New review",
                "You received " + req.rating() + " star" + (req.rating() == 1 ? "" : "s") + ".", b.getId());
        return ReviewResponse.from(saved);
    }

    // ---------------------------------------------------------------- scheduler

    /** Pending bookings nobody answered within 48 hours become EXPIRED. Returns how many were expired. */
    @Transactional
    public int expireOldPendingBookings() {
        List<Booking> old = bookingRepository.findByStatusAndCreatedAtBefore(
                BookingStatus.PENDING, LocalDateTime.now().minusHours(EXPIRY_HOURS));
        for (Booking b : old) {
            b.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(b);
            notifier.notify(b.getCustomerId(), "BOOKING_EXPIRED", "Booking expired",
                    "The provider did not reply in time. Try another provider.", b.getId());
        }
        return old.size();
    }

    // ---------------------------------------------------------------- helpers

    private Booking booking(Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    private ServiceProvider provider(Long id) {
        return providerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Provider not found"));
    }

    private User user(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void requireParty(Booking b, ServiceProvider p, Long userId) {
        if (!b.getCustomerId().equals(userId) && !p.getUserId().equals(userId)) {
            throw new ForbiddenException("You are not part of this booking");
        }
    }

    private void requireProvider(ServiceProvider p, Long userId) {
        if (!p.getUserId().equals(userId)) {
            throw new ForbiddenException("Only the provider can do this");
        }
    }

    private void requireStatus(Booking b, BookingStatus expected) {
        if (b.getStatus() != expected) {
            throw new BadRequestException("Booking is " + b.getStatus() + ", expected " + expected);
        }
    }

    private String clean(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private BookingResponse toResponse(Booking b, ServiceProvider p, Long viewerId) {
        boolean asCustomer = b.getCustomerId().equals(viewerId);
        boolean visible = b.getStatus().sharesContact();
        User customer = userRepository.findById(b.getCustomerId()).orElse(null);
        String categoryName = categoryRepository.findById(p.getCategoryId()).map(ServiceCategory::getName).orElse(null);
        String phone = null;
        String address = null;
        if (visible) {
            if (asCustomer) {
                phone = p.getPhone();
                address = p.getAddress();
            } else {
                phone = customer == null ? null : customer.getPhone();
                address = b.getCustomerAddress();
            }
        }
        ServiceReview review = reviewRepository.findByBookingId(b.getId()).orElse(null);
        return new BookingResponse(
                b.getId(), p.getId(), p.getDisplayName(), categoryName,
                customer == null ? null : customer.getName(),
                b.getStatus(), b.getScheduledAt(), b.getDescription(), b.getProviderNote(),
                asCustomer ? "CUSTOMER" : "PROVIDER", visible, phone, address,
                review != null, review == null ? null : review.getRating(), b.getCreatedAt());
    }
}
