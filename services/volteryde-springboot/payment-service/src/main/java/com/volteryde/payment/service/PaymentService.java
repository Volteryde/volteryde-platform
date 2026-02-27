package com.volteryde.payment.service;

import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.dto.PaymentVerificationResponse;

public interface PaymentService {

        PaymentInitializationResponse initializePayment(PaymentInitializationRequest request);

        PaymentVerificationResponse verifyPayment(String reference);

        void handleWebhook(String payload, String signatureHeader);

        com.volteryde.payment.dto.PaymentMethodResponse addPaymentMethod(String customerId,
                        com.volteryde.payment.dto.PaymentMethodRequest request);

        com.volteryde.payment.dto.RefundResponse refundTransaction(com.volteryde.payment.dto.RefundRequest request);

        java.util.List<com.volteryde.payment.entity.PaymentTransactionEntity> getTransactions(String customerId);

        com.volteryde.payment.dto.WalletTopupResponse topupWallet(String customerId,
                        com.volteryde.payment.dto.WalletTopupRequest request);
}
