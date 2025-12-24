package com.volteryde.payment.service;

import java.math.BigDecimal;

public interface SecurityService {

    /**
     * Generates a cryptographic signature for a transaction.
     * @param customerId The customer ID
     * @param amount The transaction amount
     * @param type The transaction type (CREDIT, DEBIT)
     * @param referenceId External reference ID (e.g., Paystack Ref)
     * @return The HMAC-SHA256 signature
     */
    String signTransaction(Long customerId, BigDecimal amount, String type, String referenceId);

    /**
     * Validates a transaction signature.
     * @param customerId The customer ID
     * @param amount The transaction amount
     * @param type The transaction type
     * @param referenceId External reference ID
     * @param signature The signature to verify
     * @return true if valid, false otherwise
     */
    boolean validateTransaction(Long customerId, BigDecimal amount, String type, String referenceId, String signature);
}
