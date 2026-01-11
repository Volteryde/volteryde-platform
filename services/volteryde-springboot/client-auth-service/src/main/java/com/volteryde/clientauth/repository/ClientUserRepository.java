package com.volteryde.clientauth.repository;

import com.volteryde.clientauth.entity.ClientUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Client User Repository
 */
@Repository
public interface ClientUserRepository extends JpaRepository<ClientUser, String> {

    Optional<ClientUser> findByPhone(String phone);

    Optional<ClientUser> findByEmail(String email);

    Optional<ClientUser> findByGoogleId(String googleId);

    Optional<ClientUser> findByAppleId(String appleId);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);
}
