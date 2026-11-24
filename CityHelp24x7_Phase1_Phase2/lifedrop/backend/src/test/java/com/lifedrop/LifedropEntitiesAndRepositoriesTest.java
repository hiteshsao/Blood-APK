package com.lifedrop;

import com.lifedrop.entity.BloodRequest;
import com.lifedrop.entity.Notification;
import com.lifedrop.entity.RequestResponse;
import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.RequestStatus;
import com.lifedrop.enums.ResponseStatus;
import com.lifedrop.enums.Role;
import com.lifedrop.enums.Urgency;
import com.lifedrop.repository.BloodRequestRepository;
import com.lifedrop.repository.NotificationRepository;
import com.lifedrop.repository.RequestResponseRepository;
import com.lifedrop.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LifedropEntitiesAndRepositoriesTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @Autowired
    private RequestResponseRepository requestResponseRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    @DisplayName("Verify BloodGroup fromLabel and compatibility logic")
    void testBloodGroupEnum() {
        assertEquals(BloodGroup.A_POSITIVE, BloodGroup.fromLabel("A+"));
        assertEquals(BloodGroup.O_NEGATIVE, BloodGroup.fromLabel("o-"));
        assertEquals(BloodGroup.AB_POSITIVE, BloodGroup.fromLabel("AB_POSITIVE"));
        assertEquals("B+", BloodGroup.B_POSITIVE.getLabel());

        // O- receives only O-
        Set<BloodGroup> oNegDonors = BloodGroup.O_NEGATIVE.getCompatibleDonorGroups();
        assertEquals(Set.of(BloodGroup.O_NEGATIVE), oNegDonors);

        // AB+ receives all
        Set<BloodGroup> abPosDonors = BloodGroup.AB_POSITIVE.getCompatibleDonorGroups();
        assertEquals(8, abPosDonors.size());
    }

    @Test
    @DisplayName("Verify User entity persistence, unique email, and queries")
    void testUserPersistenceAndRepository() {
        User donor = User.builder()
                .name("Jane Donor")
                .email("jane@example.com")
                .password("$2a$10$hashedPassword")
                .phone("+919876543210")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .age(28)
                .gender("Female")
                .city("Mumbai")
                .latitude(19.0760)
                .longitude(72.8777)
                .available(true)
                .active(true)
                .lastDonatedDate(LocalDate.now().minusMonths(4))
                .build();

        User savedDonor = userRepository.save(donor);
        assertNotNull(savedDonor.getId());
        assertNotNull(savedDonor.getCreatedAt());
        assertTrue(savedDonor.getAvailable());

        assertTrue(userRepository.existsByEmail("jane@example.com"));
        assertFalse(userRepository.existsByEmail("unknown@example.com"));

        Optional<User> found = userRepository.findByEmail("jane@example.com");
        assertTrue(found.isPresent());
        assertEquals("Jane Donor", found.get().getName());
        assertEquals(Role.DONOR, found.get().getRole());

        List<User> donors = userRepository.findByRoleAndBloodGroupAndAvailableTrue(Role.DONOR, BloodGroup.O_NEGATIVE);
        assertFalse(donors.isEmpty());
    }

    @Test
    @DisplayName("Verify BloodRequest, RequestResponse, and Notification persistence and relationships")
    void testFullWorkflowPersistence() {
        // 1. Create Recipient and Donor
        User recipient = userRepository.save(User.builder()
                .name("Rahul Recipient")
                .email("rahul@example.com")
                .password("secret123")
                .phone("+919123456789")
                .role(Role.RECIPIENT)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .city("Pune")
                .latitude(18.5204)
                .longitude(73.8567)
                .build());

        User donor = userRepository.save(User.builder()
                .name("Amit Donor")
                .email("amit@example.com")
                .password("secret123")
                .phone("+919988776655")
                .role(Role.DONOR)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .city("Pune")
                .latitude(18.5250)
                .longitude(73.8500)
                .build());

        // 2. Create BloodRequest
        BloodRequest request = BloodRequest.builder()
                .recipient(recipient)
                .patientName("Sunita Recipient")
                .bloodGroup(BloodGroup.B_POSITIVE)
                .unitsNeeded(2)
                .urgency(Urgency.URGENT)
                .city("Pune")
                .latitude(18.5204)
                .longitude(73.8567)
                .radiusKm(10.0)
                .message("Urgent requirement for surgery")
                .requiredBy(LocalDateTime.now().plusDays(2))
                .status(RequestStatus.PENDING)
                .build();

        BloodRequest savedRequest = bloodRequestRepository.save(request);
        assertNotNull(savedRequest.getId());
        assertNotNull(savedRequest.getCreatedAt());
        assertEquals(RequestStatus.PENDING, savedRequest.getStatus());

        List<BloodRequest> pendingList = bloodRequestRepository.findByStatus(RequestStatus.PENDING);
        assertFalse(pendingList.isEmpty());

        List<BloodRequest> recipientRequests = bloodRequestRepository.findByRecipientIdOrderByCreatedAtDesc(recipient.getId());
        assertEquals(1, recipientRequests.size());

        // 3. Create RequestResponse
        RequestResponse response = RequestResponse.builder()
                .request(savedRequest)
                .donor(donor)
                .status(ResponseStatus.ACCEPTED)
                .respondedAt(LocalDateTime.now())
                .build();

        RequestResponse savedResponse = requestResponseRepository.save(response);
        assertNotNull(savedResponse.getId());
        assertNotNull(savedResponse.getCreatedAt());
        assertTrue(requestResponseRepository.existsByRequestIdAndDonorId(savedRequest.getId(), donor.getId()));

        List<RequestResponse> donorResponses = requestResponseRepository.findByDonorIdAndStatusOrderByRespondedAtDesc(
                donor.getId(), ResponseStatus.ACCEPTED);
        assertEquals(1, donorResponses.size());

        // 4. Create Notification
        Notification notification = Notification.builder()
                .user(recipient)
                .title("Donor Accepted!")
                .body("Amit Donor has accepted your blood request for B+ blood.")
                .type("REQUEST_ACCEPTED")
                .relatedRequestId(savedRequest.getId())
                .read(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        assertNotNull(savedNotification.getId());
        assertNotNull(savedNotification.getCreatedAt());
        assertFalse(savedNotification.isRead());

        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(recipient.getId());
        assertEquals(1, unread.size());
        assertEquals("Donor Accepted!", unread.get(0).getTitle());

        long unreadCount = notificationRepository.countByUserIdAndReadFalse(recipient.getId());
        assertEquals(1, unreadCount);

        // Mark all as read
        int updated = notificationRepository.markAllAsReadForUser(recipient.getId());
        assertEquals(1, updated);
    }
}
