package com.volteryde.payment.service;

import com.volteryde.payment.entity.WalletBalanceEntity;
import java.math.BigDecimal;

public interface SecurityService {

    /**
     * Generates a cryptographic signature for a transaction.
     */
    String signTransaction(String customerId, BigDecimal amount, String type, String referenceId);

    /**
     * Validates a transaction signature.
     */
    boolean validateTransaction(String customerId, BigDecimal amount, String type, String referenceId,
            String signature);

    /**
     * Generates a cryptographic signature for a wallet balance state.
     */
    String signBalance(String customerId, BigDecimal realBalance, BigDecimal promoBalance);

    /**
     * Validates a wallet balance signature.
     */
    boolean validateBalance(WalletBalanceEntity wallet);
}
