package com.volteryde.payment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.dto.PaymentVerificationResponse;
import com.volteryde.payment.entity.PaymentMethodEntity;
import com.volteryde.payment.entity.PaymentTransactionEntity;
import com.volteryde.payment.entity.WalletBalanceEntity;
import com.volteryde.payment.entity.WalletTransactionEntity;
import com.volteryde.payment.exception.PaymentNotFoundException;
import com.volteryde.payment.model.PaymentProvider;
import com.volteryde.payment.model.PaymentStatus;
import com.volteryde.payment.repository.PaymentMethodRepository;
import com.volteryde.payment.repository.PaymentTransactionRepository;
import com.volteryde.payment.repository.WalletBalanceRepository;
import com.volteryde.payment.repository.WalletTransactionRepository;
import com.volteryde.payment.service.PaymentGatewayClient;
import com.volteryde.payment.service.model.PaystackVerifyResponse;
import com.volteryde.payment.service.model.PaystackVerifyResponseData;
import com.volteryde.payment.service.model.PaystackVerifyResponseDataAuthorization;
import com.volteryde.payment.service.model.PaystackWebhookEvent;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PaymentServiceImplTest {

    @Mock
    private PaymentGatewayClient paymentGatewayClient;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private PaymentMethodRepository paymentMethodRepository;

    @Mock
    private WalletBalanceRepository walletBalanceRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentServiceImpl(
                paymentGatewayClient,
                paymentTransactionRepository,
                paymentMethodRepository,
                walletBalanceRepository,
                walletTransactionRepository,
                new ObjectMapper());
    }

    @Test
    void initializePaymentShouldCreatePendingTransactionAndCallGateway() {
        PaymentInitializationRequest request = new PaymentInitializationRequest(
                new BigDecimal("2500.00"),
                "NGN",
                42L,
                "customer@example.com",
                "REF-123",
                null,
                Map.of("orderId", "ORD-1"));

        when(paymentTransactionRepository.findByReference("REF-123"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentInitializationResponse gatewayResponse = new PaymentInitializationResponse(
                request.reference(),
                "https://paystack.com/checkout",
                "ACCESS-CODE",
                PaymentStatus.PROCESSING);
        when(paymentGatewayClient.initializePayment(request)).thenReturn(gatewayResponse);

        PaymentInitializationResponse response = paymentService.initializePayment(request);

        assertThat(response).isEqualTo(gatewayResponse);

        ArgumentCaptor<PaymentTransactionEntity> captor = ArgumentCaptor.forClass(PaymentTransactionEntity.class);
        verify(paymentTransactionRepository, times(2)).save(captor.capture());
        List<PaymentTransactionEntity> savedTransactions = captor.getAllValues();

        assertThat(savedTransactions.get(0).getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(savedTransactions.get(0).getProvider()).isEqualTo(PaymentProvider.PAYSTACK);
        assertThat(savedTransactions.get(1).getStatus()).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(savedTransactions.get(1).getProviderReference()).isEqualTo("ACCESS-CODE");
        verify(paymentGatewayClient).initializePayment(request);
    }

    @Test
    void initializePaymentShouldReturnExistingSuccessTransactionWithoutGatewayCall() {
        PaymentTransactionEntity existing = new PaymentTransactionEntity();
        existing.setReference("REF-EXISTING");
        existing.setStatus(PaymentStatus.SUCCESS);
        existing.setAmount(new BigDecimal("1000.00"));
        existing.setCurrency("NGN");

        when(paymentTransactionRepository.findByReference("REF-EXISTING"))
                .thenReturn(Optional.of(existing));

        PaymentInitializationRequest request = new PaymentInitializationRequest(
                existing.getAmount(),
                existing.getCurrency(),
                99L,
                "existing@example.com",
                existing.getReference(),
                null,
                null);

        PaymentInitializationResponse response = paymentService.initializePayment(request);

        assertThat(response.reference()).isEqualTo(existing.getReference());
        assertThat(response.status()).isEqualTo(PaymentStatus.SUCCESS);
        verify(paymentGatewayClient, never()).initializePayment(any());
    }

    @Test
    void verifyPaymentShouldUpdateTransactionPersistPaymentMethodAndCreditWallet() {
        PaymentTransactionEntity transaction = new PaymentTransactionEntity();
        transaction.setCustomerId(77L);
        transaction.setReference("REF-VERIFY");
        transaction.setAmount(new BigDecimal("1500.00"));
        transaction.setCurrency("NGN");
        transaction.setStatus(PaymentStatus.PENDING);

        when(paymentTransactionRepository.findByReference("REF-VERIFY"))
                .thenReturn(Optional.of(transaction));

        PaystackVerifyResponseDataAuthorization authorization = new PaystackVerifyResponseDataAuthorization(
                "AUTH-CODE",
                "card",
                "1234",
                "01",
                "29",
                "card",
                "Bank",
                true,
                "signature",
                "John Doe");
        PaystackVerifyResponseData data = new PaystackVerifyResponseData(
                "success",
                new BigDecimal("1500.00"),
                "NGN",
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                transaction.getReference(),
                authorization);
        PaystackVerifyResponse gatewayResponse = new PaystackVerifyResponse(true, "Approved", data);

        when(paymentGatewayClient.verifyPayment("REF-VERIFY")).thenReturn(gatewayResponse);
        when(paymentMethodRepository.findByCustomerIdAndAuthorizationCode(77L, "AUTH-CODE"))
                .thenReturn(Optional.empty());
        when(paymentMethodRepository.save(any(PaymentMethodEntity.class)))
                .thenAnswer(invocation -> {
                    PaymentMethodEntity entity = invocation.getArgument(0);
                    entity.setId(10L);
                    return entity;
                });

        WalletBalanceEntity walletBalance = new WalletBalanceEntity();
        walletBalance.setCustomerId(77L);
        walletBalance.setBalance(new BigDecimal("500.00"));
        when(walletBalanceRepository.findByCustomerId(77L)).thenReturn(Optional.of(walletBalance));
        when(walletBalanceRepository.save(any(WalletBalanceEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(walletTransactionRepository.save(any(WalletTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentVerificationResponse verificationResponse = paymentService.verifyPayment("REF-VERIFY");

        assertThat(verificationResponse.status()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(walletBalance.getBalance()).isEqualTo(new BigDecimal("2000.00"));
        verify(paymentMethodRepository).save(any(PaymentMethodEntity.class));
        verify(walletTransactionRepository).save(any(WalletTransactionEntity.class));
    }

    @Test
    void verifyPaymentShouldThrowWhenTransactionMissing() {
        when(paymentTransactionRepository.findByReference("UNKNOWN"))
                .thenReturn(Optional.empty());

        assertThrows(PaymentNotFoundException.class, () -> paymentService.verifyPayment("UNKNOWN"));
    }

    @Test
    void handleWebhookShouldTriggerVerificationForChargeSuccessEvent() {
        PaymentTransactionEntity transaction = new PaymentTransactionEntity();
        transaction.setCustomerId(5L);
        transaction.setReference("REF-WEBHOOK");
        transaction.setAmount(new BigDecimal("500.00"));
        transaction.setCurrency("NGN");
        transaction.setStatus(PaymentStatus.PENDING);

        when(paymentTransactionRepository.findByReference("REF-WEBHOOK"))
                .thenReturn(Optional.of(transaction));

        PaystackVerifyResponseData data = new PaystackVerifyResponseData(
                "success",
                new BigDecimal("500.00"),
                "NGN",
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                transaction.getReference(),
                null);
        PaystackVerifyResponse verifyResponse = new PaystackVerifyResponse(true, "Approved", data);

        when(paymentGatewayClient.verifyPayment("REF-WEBHOOK")).thenReturn(verifyResponse);
        when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(walletBalanceRepository.findByCustomerId(5L))
                .thenReturn(Optional.of(new WalletBalanceEntity()));
        when(walletBalanceRepository.save(any(WalletBalanceEntity.class)))
                .thenAnswer(invocation -> {
                    WalletBalanceEntity entity = invocation.getArgument(0);
                    if (entity.getBalance() == null) {
                        entity.setBalance(BigDecimal.ZERO);
                    }
                    return entity;
                });
        when(walletTransactionRepository.save(any(WalletTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentMethodRepository.findByCustomerIdAndAuthorizationCode(eq(5L), any()))
                .thenReturn(Optional.empty());

        PaystackWebhookEvent event = new PaystackWebhookEvent(
                "charge.success",
                Map.of("reference", "REF-WEBHOOK"),
                "2024-01-01T00:00:00Z",
                "evt_123",
                BigDecimal.valueOf(50000));

        doNothing().when(paymentGatewayClient).validateWebhookSignature("{}", "signature");
        when(paymentGatewayClient.parseWebhookEvent("{}"))
                .thenReturn(event);

        paymentService.handleWebhook("{}", "signature");

        verify(paymentGatewayClient).validateWebhookSignature("{}", "signature");
        verify(paymentGatewayClient).parseWebhookEvent("{}");
        verify(paymentGatewayClient).verifyPayment("REF-WEBHOOK");
    }
}
