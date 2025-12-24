package com.volteryde.payment.dto;

import java.util.UUID;

public record PaymentMethodResponse(
		UUID id,
		String last4,
		String brand) {
}
