package com.volteryde.payment.service;

import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.dto.PaymentVerificationResponse;

public interface PaymentService {

    PaymentInitializationResponse initializePayment(PaymentInitializationRequest request);

    PaymentVerificationResponse verifyPayment(String reference);

    void handleWebhook(String payload, String signatureHeader);
}
