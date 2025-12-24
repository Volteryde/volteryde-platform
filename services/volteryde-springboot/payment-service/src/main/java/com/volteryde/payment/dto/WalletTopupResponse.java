package com.volteryde.payment.dto;

import java.math.BigDecimal;

public record WalletTopupResponse(
		Long transactionId,
		BigDecimal newBalance) {
}
