package com.volteryde.payment.dto;

import java.math.BigDecimal;

public record WalletOperationRequest(
        String userId,
        BigDecimal amount,
        String currency,
        String referenceId,
        String reason,
        String originalReferenceId // for refund
) {
}
