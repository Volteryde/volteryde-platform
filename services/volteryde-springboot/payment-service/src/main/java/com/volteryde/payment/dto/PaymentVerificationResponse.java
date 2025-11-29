package com.volteryde.payment.dto;

import com.volteryde.payment.model.PaymentStatus;
import java.math.BigDecimal;

public record PaymentVerificationResponse(
    String reference,
    PaymentStatus status,
    BigDecimal amount,
    String currency,
    String providerReference
) {
}
