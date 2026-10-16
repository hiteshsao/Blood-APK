package com.lifedrop.repository;

import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);

    List<User> findByRole(Role role);

    List<User> findByRoleAndAvailableTrue(Role role);

    List<User> findByRoleAndBloodGroupAndAvailableTrue(Role role, BloodGroup bloodGroup);

    List<User> findByRoleAndBloodGroupInAndAvailableTrue(Role role, Collection<BloodGroup> bloodGroups);

    List<User> findByRoleAndCityIgnoreCase(Role role, String city);

    List<User> findByRoleAndCityIgnoreCaseAndAvailableTrue(Role role, String city);

    /**
     * Native Haversine query to find eligible nearby donors with distance projection.
     */
    @Query(value = """
        SELECT u.id AS id,
               u.name AS name,
               u.blood_group AS bloodGroup,
               u.city AS city,
               u.last_donated_date AS lastDonatedDate,
               (6371.0 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:lat)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(u.latitude))
               )))) AS distance
        FROM users u
        WHERE u.role = 'DONOR'
          AND u.active = true
          AND u.available = true
          AND u.blood_group IN (:groups)
          AND u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL
          AND (u.last_donated_date IS NULL OR u.last_donated_date <= :eligibleBefore)
          AND (6371.0 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:lat)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(u.latitude))
               )))) < :radiusKm
        ORDER BY distance ASC
        """, nativeQuery = true)
    List<NearbyDonorProjection> findNearbyDonors(
        @Param("groups") Collection<String> groups,
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusKm") double radiusKm,
        @Param("eligibleBefore") LocalDate eligibleBefore
    );
}
