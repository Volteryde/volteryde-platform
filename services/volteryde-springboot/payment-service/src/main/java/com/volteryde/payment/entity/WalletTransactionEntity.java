package com.volteryde.payment.entity;

import com.volteryde.payment.model.WalletTransactionType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "wallet_transactions")
public class WalletTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long customerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private WalletTransactionType type;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(length = 256)
    private String description;

    @Column(name = "reference_id", unique = true)
    private String referenceId;

    /**
     * Cryptographic signature of the transaction details to prevent tampering.
     */
    @Column(nullable = false, length = 512)
    private String signature;

    /**
     * Indicates if this affects REAL or PROMO balance.
     */
    @Column(name = "balance_type", nullable = false)
    private String balanceType; // "REAL" or "PROMO"

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
        if (balanceType == null) balanceType = "REAL"; // Default to REAL for backward compatibility if needed
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

    public WalletTransactionType getType() {
        return type;
    }

    public void setType(WalletTransactionType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public String getBalanceType() {
        return balanceType;
    }

    public void setBalanceType(String balanceType) {
        this.balanceType = balanceType;
    }
}
