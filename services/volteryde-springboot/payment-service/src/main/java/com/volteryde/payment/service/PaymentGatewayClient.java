package com.volteryde.payment.service;

import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.service.model.PaystackVerifyResponse;
import com.volteryde.payment.service.model.PaystackWebhookEvent;

public interface PaymentGatewayClient {

    PaymentInitializationResponse initializePayment(PaymentInitializationRequest request);

    PaystackVerifyResponse verifyPayment(String reference);

    void validateWebhookSignature(String payload, String signatureHeader);

    PaystackWebhookEvent parseWebhookEvent(String payload);
}
