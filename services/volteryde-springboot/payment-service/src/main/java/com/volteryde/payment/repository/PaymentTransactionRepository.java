package com.volteryde.payment.repository;

import com.volteryde.payment.entity.PaymentTransactionEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, Long> {

    Optional<PaymentTransactionEntity> findByReference(String reference);

    java.util.List<PaymentTransactionEntity> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
