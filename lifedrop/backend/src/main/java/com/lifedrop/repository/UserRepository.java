package com.lifedrop.repository;

import com.lifedrop.entity.User;
import com.lifedrop.enums.BloodGroup;
import com.lifedrop.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
     * Native Haversine query to find available donors within radiusKm matching compatible blood groups.
     * Uses least/greatest to protect against acos floating-point rounding errors.
     */
    @Query(value = """
        SELECT u.*,
               (6371 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:latitude)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) * sin(radians(u.latitude))
               )))) AS distance
        FROM users u
        WHERE u.role = 'DONOR'
          AND u.available = true
          AND u.active = true
          AND u.blood_group IN (:bloodGroups)
          AND u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL
          AND (6371 * acos(least(1.0, greatest(-1.0,
                   cos(radians(:latitude)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) * sin(radians(u.latitude))
               )))) <= :radiusKm
        ORDER BY distance ASC
        """, nativeQuery = true)
    List<User> findNearbyDonors(
        @Param("latitude") double latitude,
        @Param("longitude") double longitude,
        @Param("radiusKm") double radiusKm,
        @Param("bloodGroups") Collection<String> bloodGroups
    );
}
