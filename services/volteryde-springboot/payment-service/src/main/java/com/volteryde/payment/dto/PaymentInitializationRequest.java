package com.volteryde.payment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.Map;

public record PaymentInitializationRequest(
    @NotNull @Positive BigDecimal amount,
    @NotBlank String currency,
    @NotNull Long customerId,
    @NotBlank @Email String customerEmail,
    @NotBlank String reference,
    String callbackUrl,
    Map<String, Object> metadata
) {
}
