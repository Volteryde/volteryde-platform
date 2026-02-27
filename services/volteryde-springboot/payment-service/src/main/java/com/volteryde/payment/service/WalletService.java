package com.volteryde.payment.service;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.dto.WalletTransactionResponse;
import com.volteryde.payment.entity.WalletBalanceEntity;
import java.math.BigDecimal;
import java.util.List;

public interface WalletService {

	WalletBalanceResponse getBalance(String customerId);

	List<WalletTransactionResponse> getHistory(String customerId);

	/**
	 * Deposit real funds (e.g. from Paystack).
	 * Requires signature validation.
	 */
	WalletBalanceEntity depositRealFunds(String customerId, BigDecimal amount, String referenceId, String signature);

	/**
	 * Add promo/support funds.
	 * Only callable by admin/support (controlled by Controller security, but we
	 * sign the transaction here).
	 */
	WalletBalanceEntity addSupportFunds(String customerId, BigDecimal amount, String reason, String adminId);

	/**
	 * Debit funds (consumes Promo first, then Real).
	 */
	WalletBalanceEntity debit(String customerId, BigDecimal amount, String referenceId);

	/**
	 * Refund a transaction (partial or full).
	 * Credits the amount back to Real Balance (simplified).
	 */
	WalletBalanceEntity refund(String customerId, String originalReferenceId, BigDecimal amount);

	// Deprecated simple credit
	WalletBalanceEntity credit(String customerId, BigDecimal amount);
}
