package com.volteryde.payment.controller;

import com.volteryde.payment.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/v1/payments/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
public class PaystackWebhookController {

    private static final String SIGNATURE_HEADER = "x-paystack-signature";

    private final PaymentService paymentService;

    public PaystackWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<String> receiveWebhook(
        @RequestBody String payload,
        @RequestHeader(value = SIGNATURE_HEADER, required = false) String signatureHeader
    ) {
        paymentService.handleWebhook(payload, signatureHeader);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
