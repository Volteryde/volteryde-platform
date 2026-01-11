package com.volteryde.clientauth.repository;

import com.volteryde.clientauth.entity.ClientRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Client Refresh Token Repository
 */
@Repository
public interface ClientRefreshTokenRepository extends JpaRepository<ClientRefreshToken, String> {

    Optional<ClientRefreshToken> findByToken(String token);

    @Modifying
    @Query("UPDATE ClientRefreshToken t SET t.revoked = true WHERE t.user.id = :userId")
    void revokeAllByUserId(String userId);

    @Modifying
    @Query("DELETE FROM ClientRefreshToken t WHERE t.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();
}
