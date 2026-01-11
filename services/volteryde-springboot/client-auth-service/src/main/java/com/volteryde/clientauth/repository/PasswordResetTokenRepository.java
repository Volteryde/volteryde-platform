package com.volteryde.clientauth.repository;

import com.volteryde.clientauth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Password Reset Token Repository
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user.id = :userId AND t.used = false")
    void invalidateAllByUserId(String userId);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();
}
