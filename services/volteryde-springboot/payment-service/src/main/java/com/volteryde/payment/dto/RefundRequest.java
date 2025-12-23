package com.volteryde.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RefundRequest(
		@NotNull UUID transactionId,
		@NotBlank String reason) {
}
