package com.volteryde.payment.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "wallet_balances")
public class WalletBalanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long customerId;

    /**
     * Real funds deposited via Paystack or other payment gateways.
     */
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal realBalance;

    /**
     * Promotional or support funds added by system administrators.
     */
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal promoBalance;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        final OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (realBalance == null) realBalance = BigDecimal.ZERO;
        if (promoBalance == null) promoBalance = BigDecimal.ZERO;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public BigDecimal getTotalBalance() {
        return (realBalance != null ? realBalance : BigDecimal.ZERO)
                .add(promoBalance != null ? promoBalance : BigDecimal.ZERO);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public BigDecimal getRealBalance() {
        return realBalance;
    }

    public void setRealBalance(BigDecimal realBalance) {
        this.realBalance = realBalance;
    }

    public BigDecimal getPromoBalance() {
        return promoBalance;
    }

    public void setPromoBalance(BigDecimal promoBalance) {
        this.promoBalance = promoBalance;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
