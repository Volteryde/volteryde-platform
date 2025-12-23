package com.volteryde.payment.controller;

import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.dto.PaymentVerificationResponse;
import com.volteryde.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/initialize")
    public ResponseEntity<PaymentInitializationResponse> initializePayment(
            @RequestBody @Valid PaymentInitializationRequest request,
            HttpServletRequest httpRequest) {
        // Extract authenticated customer ID from request attribute (set by auth filter)
        // Falls back to request payload if not authenticated (for guest checkout)
        Long authenticatedCustomerId = (Long) httpRequest.getAttribute("authenticatedUserId");

        PaymentInitializationRequest secureRequest;
        if (authenticatedCustomerId != null) {
            // Use authenticated customer ID instead of trusting request payload
            secureRequest = new PaymentInitializationRequest(
                    request.amount(),
                    request.currency(),
                    authenticatedCustomerId, // Use authenticated ID
                    request.customerEmail(),
                    request.reference(),
                    request.callbackUrl(),
                    request.authorizationCode(),
                    request.metadata());
        } else {
            // Guest checkout or no auth - use request payload
            secureRequest = request;
        }

        return ResponseEntity.ok(paymentService.initializePayment(secureRequest));
    }

    @GetMapping("/{reference}/verify")
    public ResponseEntity<PaymentVerificationResponse> verifyPayment(@PathVariable String reference) {
        return ResponseEntity.ok(paymentService.verifyPayment(reference));
    }

    @PostMapping("/payment-methods")
    public ResponseEntity<com.volteryde.payment.dto.PaymentMethodResponse> addPaymentMethod(
            @RequestBody @Valid com.volteryde.payment.dto.PaymentMethodRequest request,
            HttpServletRequest httpRequest) {
        Long customerId = (Long) httpRequest.getAttribute("authenticatedUserId");
        if (customerId == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(paymentService.addPaymentMethod(customerId, request));
    }

    @GetMapping("/transactions")
    public ResponseEntity<java.util.List<com.volteryde.payment.entity.PaymentTransactionEntity>> getTransactions(
            HttpServletRequest httpRequest) {
        Long customerId = (Long) httpRequest.getAttribute("authenticatedUserId");
        if (customerId == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(paymentService.getTransactions(customerId));
    }

    @PostMapping("/refunds")
    public ResponseEntity<com.volteryde.payment.dto.RefundResponse> refundTransaction(
            @RequestBody @Valid com.volteryde.payment.dto.RefundRequest request) {
        return ResponseEntity.ok(paymentService.refundTransaction(request));
    }
}
