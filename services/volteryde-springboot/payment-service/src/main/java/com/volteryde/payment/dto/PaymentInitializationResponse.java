package com.volteryde.payment.dto;

import com.volteryde.payment.model.PaymentStatus;

public record PaymentInitializationResponse(
    String reference,
    String authorizationUrl,
    String accessCode,
    PaymentStatus status
) {
}
