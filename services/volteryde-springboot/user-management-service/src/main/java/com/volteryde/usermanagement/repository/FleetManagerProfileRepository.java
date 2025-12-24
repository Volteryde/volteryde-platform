package com.volteryde.usermanagement.repository;

import com.volteryde.usermanagement.model.FleetManagerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FleetManagerProfileRepository extends JpaRepository<FleetManagerProfile, UUID> {
	Optional<FleetManagerProfile> findByUserId(UUID userId);
}
