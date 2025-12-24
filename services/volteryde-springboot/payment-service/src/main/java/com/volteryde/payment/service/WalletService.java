package com.volteryde.payment.service;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.dto.WalletTransactionResponse;
import com.volteryde.payment.entity.WalletBalanceEntity;
import java.math.BigDecimal;
import java.util.List;

public interface WalletService {

	WalletBalanceResponse getBalance(Long customerId);

	List<WalletTransactionResponse> getHistory(Long customerId);

    /**
     * Deposit real funds (e.g. from Paystack).
     * Requires signature validation.
     */
	WalletBalanceEntity depositRealFunds(Long customerId, BigDecimal amount, String referenceId, String signature);

    /**
     * Add promo/support funds.
     * Only callable by admin/support (controlled by Controller security, but we sign the transaction here).
     */
	WalletBalanceEntity addSupportFunds(Long customerId, BigDecimal amount, String reason, String adminId);

	/**
	 * Debit funds (consumes Promo first, then Real).
	 */
	WalletBalanceEntity debit(Long customerId, BigDecimal amount, String referenceId);

	// Deprecated simple credit
	WalletBalanceEntity credit(Long customerId, BigDecimal amount);
}
