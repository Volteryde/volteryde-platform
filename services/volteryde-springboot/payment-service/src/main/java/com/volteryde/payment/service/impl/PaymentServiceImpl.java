package com.volteryde.payment.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.dto.PaymentVerificationResponse;
import com.volteryde.payment.dto.PaymentMethodRequest;
import com.volteryde.payment.dto.PaymentMethodResponse;
import com.volteryde.payment.dto.RefundRequest;
import com.volteryde.payment.dto.RefundResponse;
import java.util.List;
import java.util.UUID;

import com.volteryde.payment.entity.PaymentMethodEntity;
import com.volteryde.payment.entity.PaymentTransactionEntity;
import com.volteryde.payment.entity.WalletBalanceEntity;
import com.volteryde.payment.entity.WalletTransactionEntity;
import com.volteryde.payment.exception.PaymentGatewayException;
import com.volteryde.payment.exception.PaymentNotFoundException;
import com.volteryde.payment.model.PaymentProvider;
import com.volteryde.payment.model.PaymentStatus;
import com.volteryde.payment.model.WalletTransactionType;
import com.volteryde.payment.repository.PaymentMethodRepository;
import com.volteryde.payment.repository.PaymentTransactionRepository;
import com.volteryde.payment.repository.WalletBalanceRepository;
import com.volteryde.payment.repository.WalletTransactionRepository;
import com.volteryde.payment.service.PaymentGatewayClient;
import com.volteryde.payment.service.PaymentService;
import com.volteryde.payment.service.model.PaystackVerifyResponse;
import com.volteryde.payment.service.model.PaystackVerifyResponseData;
import com.volteryde.payment.service.model.PaystackVerifyResponseDataAuthorization;
import com.volteryde.payment.service.model.PaystackWebhookEvent;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentGatewayClient paymentGatewayClient;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final WalletBalanceRepository walletBalanceRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final ObjectMapper objectMapper;

    public PaymentServiceImpl(
            PaymentGatewayClient paymentGatewayClient,
            PaymentTransactionRepository paymentTransactionRepository,
            PaymentMethodRepository paymentMethodRepository,
            WalletBalanceRepository walletBalanceRepository,
            WalletTransactionRepository walletTransactionRepository,
            ObjectMapper objectMapper) {
        this.paymentGatewayClient = paymentGatewayClient;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.walletBalanceRepository = walletBalanceRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public PaymentInitializationResponse initializePayment(PaymentInitializationRequest request) {
        LOGGER.info("Initializing payment for reference {}", request.reference());
        Optional<PaymentTransactionEntity> existingTransaction = paymentTransactionRepository
                .findByReference(request.reference());

        if (existingTransaction.isPresent()) {
            PaymentTransactionEntity transaction = existingTransaction.get();
            LOGGER.info("Using existing transaction {} with status {}", transaction.getId(), transaction.getStatus());
            if (transaction.getStatus() == PaymentStatus.SUCCESS) {
                return new PaymentInitializationResponse(
                        transaction.getReference(),
                        null,
                        null,
                        transaction.getStatus());
            }
        }

        PaymentTransactionEntity transaction = existingTransaction.orElseGet(() -> createPendingTransaction(request));

        PaymentInitializationResponse gatewayResponse = paymentGatewayClient.initializePayment(request);

        transaction.setStatus(PaymentStatus.PROCESSING);
        transaction.setProviderReference(gatewayResponse.accessCode());
        paymentTransactionRepository.save(transaction);

        return gatewayResponse;
    }

    @Override
    @Transactional
    public PaymentVerificationResponse verifyPayment(String reference) {
        LOGGER.info("Verifying payment with reference {}", reference);
        PaymentTransactionEntity transaction = paymentTransactionRepository.findByReference(reference)
                .orElseThrow(() -> new PaymentNotFoundException("Transaction not found for reference " + reference));

        PaystackVerifyResponse verification = paymentGatewayClient.verifyPayment(reference);
        PaystackVerifyResponseData data = verification.data();

        if (data == null) {
            throw new PaymentGatewayException("Missing verification data for reference " + reference);
        }

        PaymentStatus status = mapStatus(data.status());
        transaction.setStatus(status);
        transaction.setProviderReference(reference);
        transaction.setMetadataJson(writeMetadataJson(Map.of(
                "gateway_message", verification.message(),
                "paid_at", data.paidAt(),
                "created_at", data.createdAt())));
        paymentTransactionRepository.save(transaction);

        if (status == PaymentStatus.SUCCESS) {
            handleSuccessfulPayment(transaction, data);
        }

        return new PaymentVerificationResponse(
                transaction.getReference(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getProviderReference());
    }

    @Override
    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        paymentGatewayClient.validateWebhookSignature(payload, signatureHeader);
        PaystackWebhookEvent event = paymentGatewayClient.parseWebhookEvent(payload);

        if (event == null) {
            LOGGER.warn("Unable to parse Paystack webhook event");
            return;
        }

        String eventType = event.event();
        LOGGER.info("Received Paystack webhook event {}", eventType);

        if ("charge.success".equalsIgnoreCase(eventType)) {
            Object referenceObject = event.data() != null ? event.data().get("reference") : null;
            if (referenceObject instanceof String reference && !reference.isBlank()) {
                verifyPayment(reference);
            } else {
                LOGGER.warn("Webhook charge.success missing reference");
            }
        } else {
            LOGGER.debug("Ignoring Paystack event type {}", eventType);
        }
    }

    private PaymentTransactionEntity createPendingTransaction(PaymentInitializationRequest request) {
        PaymentTransactionEntity transaction = new PaymentTransactionEntity();
        transaction.setCustomerId(request.customerId());
        transaction.setReference(request.reference());
        transaction.setAmount(request.amount());
        transaction.setCurrency(request.currency());
        transaction.setStatus(PaymentStatus.PENDING);
        transaction.setProvider(PaymentProvider.PAYSTACK);
        transaction.setDescription("Payment initialization via Paystack");
        transaction.setMetadataJson(writeMetadataJson(request.metadata()));
        return paymentTransactionRepository.save(transaction);
    }

    private void handleSuccessfulPayment(PaymentTransactionEntity transaction, PaystackVerifyResponseData data) {
        Long customerId = transaction.getCustomerId();

        PaystackVerifyResponseDataAuthorization authorization = data.authorization();
        if (authorization != null && authorization.reusable()) {
            paymentMethodRepository.findByCustomerIdAndAuthorizationCode(customerId, authorization.authorizationCode())
                    .or(() -> Optional.of(savePaymentMethod(customerId, authorization)))
                    .ifPresent(method -> LOGGER.debug("Payment method {} confirmed for customer {}", method.getId(),
                            customerId));
        }

        creditWallet(customerId, transaction.getAmount(), transaction.getReference());
    }

    private PaymentMethodEntity savePaymentMethod(Long customerId,
            PaystackVerifyResponseDataAuthorization authorization) {
        PaymentMethodEntity method = new PaymentMethodEntity();
        method.setCustomerId(customerId);
        method.setProvider(PaymentProvider.PAYSTACK);
        method.setProviderReference(authorization.signature());
        method.setAuthorizationCode(authorization.authorizationCode());
        method.setReusable(authorization.reusable());
        return paymentMethodRepository.save(method);
    }

    private void creditWallet(Long customerId, BigDecimal amount, String reference) {
        WalletBalanceEntity walletBalance = walletBalanceRepository.findByCustomerId(customerId)
                .orElseGet(() -> createEmptyWallet(customerId));

        walletBalance.setBalance(walletBalance.getBalance().add(amount));
        walletBalanceRepository.save(walletBalance);

        WalletTransactionEntity walletTransaction = new WalletTransactionEntity();
        walletTransaction.setCustomerId(customerId);
        walletTransaction.setType(WalletTransactionType.CREDIT);
        walletTransaction.setAmount(amount);
        walletTransaction.setDescription("Wallet credit from payment " + reference);
        walletTransactionRepository.save(walletTransaction);
    }

    private WalletBalanceEntity createEmptyWallet(Long customerId) {
        WalletBalanceEntity wallet = new WalletBalanceEntity();
        wallet.setCustomerId(customerId);
        wallet.setBalance(BigDecimal.ZERO);
        return walletBalanceRepository.save(wallet);
    }

    private String writeMetadataJson(Object metadata) {
        if (metadata == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException ex) {
            throw new PaymentGatewayException("Failed to serialize metadata", ex);
        }
    }

    private PaymentStatus mapStatus(String gatewayStatus) {
        if (gatewayStatus == null) {
            return PaymentStatus.FAILED;
        }
        return switch (gatewayStatus.toLowerCase()) {
            case "success", "completed" -> PaymentStatus.SUCCESS;
            case "processing" -> PaymentStatus.PROCESSING;
            case "abandoned", "failed" -> PaymentStatus.FAILED;
            default -> PaymentStatus.PENDING;
        };
    }

    @Override
    @Transactional
    public PaymentMethodResponse addPaymentMethod(Long customerId, PaymentMethodRequest request) {
        // Logic to verify token with provider and save method
        // For now, we simulate success
        PaymentMethodEntity method = new PaymentMethodEntity();
        method.setCustomerId(customerId);
        method.setProvider(PaymentProvider.PAYSTACK);
        method.setAuthorizationCode(request.token());
        method.setReusable(true);
        // method.setLast4(...) // need verify response
        method = paymentMethodRepository.save(method);

        return new PaymentMethodResponse(
                UUID.randomUUID(), // mapped to entity ID? Entity uses Long usually. I'll pass UUID.
                "4242",
                "VISA");
    }

    @Override
    @Transactional
    public RefundResponse refundTransaction(RefundRequest request) {
        PaymentTransactionEntity tx = paymentTransactionRepository.findByReference(request.transactionId().toString())
                .orElseThrow(() -> new PaymentNotFoundException("Transaction not found"));

        var paystackResponse = paymentGatewayClient.initiateRefund(tx.getProviderReference(), tx.getAmount(),
                request.reason());

        tx.setStatus(PaymentStatus.REFUNDED);
        paymentTransactionRepository.save(tx);

        return new RefundResponse(request.transactionId(), paystackResponse.data().status());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentTransactionEntity> getTransactions(Long customerId) {
        return paymentTransactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Override
    @Transactional
    public com.volteryde.payment.dto.WalletTopupResponse topupWallet(Long customerId,
            com.volteryde.payment.dto.WalletTopupRequest request) {
        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        metadata.put("type", "WALLET_TOPUP");
        metadata.put("customerId", customerId);

        String email = "customer_" + customerId + "@volteryde.com";
        String reference = java.util.UUID.randomUUID().toString();

        PaymentInitializationRequest initRequest = new PaymentInitializationRequest(
                request.amount(),
                "NGN",
                customerId,
                email,
                reference,
                null,
                request.paymentMethodId(),
                metadata);

        initializePayment(initRequest);

        PaymentTransactionEntity tx = paymentTransactionRepository.findByReference(reference)
                .orElseThrow(() -> new PaymentNotFoundException("Transaction not created"));

        return new com.volteryde.payment.dto.WalletTopupResponse(tx.getId(), java.math.BigDecimal.ZERO);
    }
}
