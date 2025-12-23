package com.volteryde.payment.dto;

import java.math.BigDecimal;

public record WalletBalanceResponse(
		Long customerId,
		BigDecimal balance,
		String currency) {
}
