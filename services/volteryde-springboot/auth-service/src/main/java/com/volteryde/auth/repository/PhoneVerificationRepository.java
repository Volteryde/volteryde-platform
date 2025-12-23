package com.volteryde.auth.repository;

import com.volteryde.auth.entity.PhoneVerificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PhoneVerificationRepository extends JpaRepository<PhoneVerificationEntity, Long> {

	// Find the latest unexpired verification code for a phone number
	Optional<PhoneVerificationEntity> findTopByPhoneAndExpiresAtAfterOrderByCreatedAtDesc(String phone,
			LocalDateTime now);

	// Find valid code
	Optional<PhoneVerificationEntity> findTopByPhoneAndCodeAndExpiresAtAfterAndVerifiedFalse(String phone, String code,
			LocalDateTime now);
}
