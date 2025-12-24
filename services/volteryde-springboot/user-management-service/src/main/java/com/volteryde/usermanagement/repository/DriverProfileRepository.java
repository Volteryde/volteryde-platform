package com.volteryde.usermanagement.repository;

import com.volteryde.usermanagement.model.DriverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile, UUID> {
	Optional<DriverProfile> findByUserId(UUID userId);

	Optional<DriverProfile> findByLicenseNumber(String licenseNumber);
}
