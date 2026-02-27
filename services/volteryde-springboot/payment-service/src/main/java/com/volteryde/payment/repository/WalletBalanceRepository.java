package com.volteryde.payment.repository;

import com.volteryde.payment.entity.WalletBalanceEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletBalanceRepository extends JpaRepository<WalletBalanceEntity, Long> {

    Optional<WalletBalanceEntity> findByCustomerId(String customerId);
}
