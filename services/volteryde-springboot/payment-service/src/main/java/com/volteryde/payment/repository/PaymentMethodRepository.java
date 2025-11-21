package com.volteryde.payment.repository;

import com.volteryde.payment.entity.PaymentMethodEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethodEntity, Long> {

    List<PaymentMethodEntity> findByCustomerId(Long customerId);

    Optional<PaymentMethodEntity> findByCustomerIdAndAuthorizationCode(Long customerId, String authorizationCode);
}
