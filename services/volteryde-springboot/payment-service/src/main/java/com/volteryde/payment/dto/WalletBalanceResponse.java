package com.volteryde.payment.dto;

import java.math.BigDecimal;

public record WalletBalanceResponse(
		String customerId,
		BigDecimal realBalance,
		BigDecimal promoBalance,
		BigDecimal totalBalance,
		String currency) {
}
