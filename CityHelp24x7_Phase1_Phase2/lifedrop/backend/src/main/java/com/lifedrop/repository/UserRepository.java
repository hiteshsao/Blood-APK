package com.lifedrop.repository;

import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    /** Public stats: active accounts with a donor profile enabled. */
    long countByDonorEnabledTrueAndActiveTrue();

    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);

    List<User> findByRole(Role role);

    List<User> findByDonorEnabledTrue();

    List<User> findByRoleAndAvailableTrue(Role role);

    List<User> findByRoleAndBloodGroupAndAvailableTrue(Role role, BloodGroup bloodGroup);

    List<User> findByRoleAndBloodGroupInAndAvailableTrue(Role role, Collection<BloodGroup> bloodGroups);

    List<User> findByRoleAndCityIgnoreCase(Role role, String city);

    List<User> findByRoleAndCityIgnoreCaseAndAvailableTrue(Role role, String city);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.donorEnabled = true WHERE u.role = com.lifedrop.enums.Role.DONOR AND (u.donorEnabled = false OR u.donorEnabled IS NULL)")
    int migrateLegacyDonorsToDonorEnabled();

    /**
     * Native Haversine query to find eligible nearby donors with distance projection.
     */
    @Query(value = """
        SELECT u.id AS id,
               u.name AS name,
               u.blood_group AS bloodGroup,
               u.city AS city,
               u.latitude AS latitude,
               u.longitude AS longitude,
               u.last_donated_date AS lastDonatedDate,
               (6371.0 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:lat)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(u.latitude))
               )))) AS distance
        FROM users u
        WHERE u.donor_enabled = true
          AND u.active = true
          AND u.available = true
          AND u.id <> :excludeUserId
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
        @Param("eligibleBefore") LocalDate eligibleBefore,
        @Param("excludeUserId") long excludeUserId
    );

    /**
     * Native Haversine query to find eligible nearby donors with distance projection filtered by city_id.
     */
    @Query(value = """
        SELECT u.id AS id,
               u.name AS name,
               u.blood_group AS bloodGroup,
               u.city AS city,
               u.latitude AS latitude,
               u.longitude AS longitude,
               u.last_donated_date AS lastDonatedDate,
               (6371.0 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:lat)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(u.latitude))
               )))) AS distance
        FROM users u
        WHERE u.donor_enabled = true
          AND u.active = true
          AND u.available = true
          AND u.id <> :excludeUserId
          AND u.blood_group IN (:groups)
          AND u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL
          AND (u.last_donated_date IS NULL OR u.last_donated_date <= :eligibleBefore)
          AND u.city_id = :cityId
          AND (6371.0 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:lat)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(u.latitude))
               )))) < :radiusKm
        ORDER BY distance ASC
        """, nativeQuery = true)
    List<NearbyDonorProjection> findNearbyDonorsByCity(
        @Param("groups") Collection<String> groups,
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusKm") double radiusKm,
        @Param("eligibleBefore") LocalDate eligibleBefore,
        @Param("cityId") Long cityId,
        @Param("excludeUserId") long excludeUserId
    );

    /**
     * Query to find eligible compatible donors in a specific city when coordinates are not supplied.
     */
    @Query(value = """
        SELECT u.id AS id,
               u.name AS name,
               u.blood_group AS bloodGroup,
               u.city AS city,
               u.latitude AS latitude,
               u.longitude AS longitude,
               u.last_donated_date AS lastDonatedDate,
               0.0 AS distance
        FROM users u
        WHERE u.donor_enabled = true
          AND u.active = true
          AND u.available = true
          AND u.id <> :excludeUserId
          AND u.blood_group IN (:groups)
          AND (u.last_donated_date IS NULL OR u.last_donated_date <= :eligibleBefore)
          AND u.city_id = :cityId
        ORDER BY u.name ASC
        """, nativeQuery = true)
    List<NearbyDonorProjection> findDonorsByCity(
        @Param("groups") Collection<String> groups,
        @Param("cityId") Long cityId,
        @Param("eligibleBefore") LocalDate eligibleBefore,
        @Param("excludeUserId") long excludeUserId
    );
}
