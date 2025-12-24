package com.volteryde.payment.dto;

import com.volteryde.payment.model.WalletTransactionType;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record WalletTransactionResponse(
		Long id,
		BigDecimal amount,
		WalletTransactionType type,
		String description,
		OffsetDateTime createdAt) {
}
