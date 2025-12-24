package com.volteryde.payment.service.model;

public record PaystackRefundResponse(
		boolean status,
		String message,
		PaystackRefundResponseData data) {
}
