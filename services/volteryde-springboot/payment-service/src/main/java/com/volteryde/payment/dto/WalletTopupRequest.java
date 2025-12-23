package com.volteryde.payment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record WalletTopupRequest(
		@NotNull @Positive BigDecimal amount,
		@NotNull String paymentMethodId) {
}
