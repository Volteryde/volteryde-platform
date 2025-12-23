package com.volteryde.payment.service.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public record PaystackRefundResponseData(
		Long id,
		String status,
		BigDecimal amount,
		String currency,
		@JsonProperty("customer_note") String customerNote,
		@JsonProperty("merchant_note") String merchantNote) {
}
