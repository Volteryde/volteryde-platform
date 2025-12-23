package com.volteryde.payment.service.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PaystackRefundResponse(
		boolean status,
		String message,
		PaystackRefundResponseData data) {
}
