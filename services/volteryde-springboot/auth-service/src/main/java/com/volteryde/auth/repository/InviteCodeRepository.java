package com.volteryde.auth.repository;

import com.volteryde.auth.entity.InviteCodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InviteCodeRepository extends JpaRepository<InviteCodeEntity, String> {

	Optional<InviteCodeEntity> findByCode(String code);

	Optional<InviteCodeEntity> findByCodeAndActiveTrue(String code);
}
