package com.volteryde.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentMethodRequest(
		@NotBlank String type, // CARD | MOBILE_MONEY
		@NotBlank String token) {
}
