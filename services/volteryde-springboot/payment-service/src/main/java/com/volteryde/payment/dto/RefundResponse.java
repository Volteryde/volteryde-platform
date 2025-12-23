package com.volteryde.payment.dto;

import java.util.UUID;

public record RefundResponse(
		UUID refundId,
		String status // PENDING | APPROVED | REJECTED
) {
}
