package com.volteryde.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record PaymentMethodRequest(
		@NotBlank String type, // CARD | MOBILE_MONEY
		@NotBlank String token) {
}
