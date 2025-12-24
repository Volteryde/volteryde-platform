package com.volteryde.auth.repository;

import com.volteryde.auth.entity.RefreshTokenEntity;
import com.volteryde.auth.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for refresh token data access
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {

	Optional<RefreshTokenEntity> findByToken(String token);

	List<RefreshTokenEntity> findByUserAndRevokedFalse(UserEntity user);

	@Modifying
	@Query("UPDATE RefreshTokenEntity r SET r.revoked = true WHERE r.user = :user")
	void revokeAllUserTokens(UserEntity user);

	@Modifying
	@Query("DELETE FROM RefreshTokenEntity r WHERE r.expiryDate < :now")
	void deleteExpiredTokens(LocalDateTime now);

	@Modifying
	@Query("UPDATE RefreshTokenEntity r SET r.revoked = true WHERE r.token = :token")
	void revokeToken(String token);
}
