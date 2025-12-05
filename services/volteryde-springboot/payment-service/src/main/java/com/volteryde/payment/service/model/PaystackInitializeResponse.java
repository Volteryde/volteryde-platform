package com.volteryde.payment.service.model;

public record PaystackInitializeResponse(
    boolean status,
    String message,
    PaystackInitializeResponseData data
) {
}
