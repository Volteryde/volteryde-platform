package com.volteryde.clientauth.repository;

import com.volteryde.clientauth.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * OTP Repository
 */
@Repository
public interface OtpRepository extends JpaRepository<Otp, String> {

    Optional<Otp> findTopByPhoneAndUsedFalseOrderByCreatedAtDesc(String phone);

    Optional<Otp> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);

    @Modifying
    @Query("UPDATE Otp o SET o.used = true WHERE o.phone = :phone AND o.used = false")
    void invalidateAllByPhone(String phone);

    @Modifying
    @Query("UPDATE Otp o SET o.used = true WHERE o.email = :email AND o.used = false")
    void invalidateAllByEmail(String email);

    @Modifying
    @Query("DELETE FROM Otp o WHERE o.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredOtps();
}
