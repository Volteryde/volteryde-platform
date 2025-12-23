package com.volteryde.auth.repository;

import com.volteryde.auth.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for user data access
 */
@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

	Optional<UserEntity> findByEmail(String email);

	boolean existsByEmail(String email);

	Optional<UserEntity> findByEmailVerificationToken(String token);

	Optional<UserEntity> findByPasswordResetToken(String token);
}
