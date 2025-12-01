package com.volteryde.payment.service.model;

public record PaystackVerifyResponse(
    boolean status,
    String message,
    PaystackVerifyResponseData data
) {
}
