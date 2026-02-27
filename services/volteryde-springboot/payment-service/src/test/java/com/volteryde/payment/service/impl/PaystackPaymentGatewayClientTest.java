package com.volteryde.payment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.volteryde.payment.config.PaystackProperties;
import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.exception.InvalidWebhookSignatureException;
import com.volteryde.payment.exception.PaymentGatewayException;
import com.volteryde.payment.service.model.PaystackInitializeResponse;
import com.volteryde.payment.service.model.PaystackInitializeResponseData;
import com.volteryde.payment.service.model.PaystackVerifyResponse;
import com.volteryde.payment.service.model.PaystackVerifyResponseData;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({ "null", "unchecked" })
class PaystackPaymentGatewayClientTest {

    @Mock
    private RestTemplate restTemplate;

    private PaystackPaymentGatewayClient paystackClient;
    private PaystackProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        properties = new PaystackProperties();
        properties.setSecretKey("test_secret");
        properties.setBaseUrl("https://api.paystack.co");
        paystackClient = new PaystackPaymentGatewayClient(restTemplate, properties, objectMapper);
    }

    @Test
    void initializePaymentShouldCallPaystackAndReturnInitializationResponse() {
        PaymentInitializationRequest request = new PaymentInitializationRequest(
                new BigDecimal("1000.00"),
                "NGN",
                "1",
                "user@example.com",
                "REF-100",
                "https://callback",
                null,
                Map.of("orderId", "ORD-1"));

        PaystackInitializeResponseData data = new PaystackInitializeResponseData(
                "https://paystack/checkout",
                "ACCESS-CODE",
                "REF-100");
        PaystackInitializeResponse response = new PaystackInitializeResponse(true, "OK", data);

        when(restTemplate.postForEntity(eq("/transaction/initialize"), any(HttpEntity.class),
                eq(PaystackInitializeResponse.class)))
                .thenReturn(ResponseEntity.ok(response));

        PaymentInitializationResponse initializationResponse = paystackClient.initializePayment(request);

        assertThat(initializationResponse.reference()).isEqualTo("REF-100");
        assertThat(initializationResponse.authorizationUrl()).isEqualTo("https://paystack/checkout");
        assertThat(initializationResponse.accessCode()).isEqualTo("ACCESS-CODE");

        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("/transaction/initialize"), captor.capture(),
                eq(PaystackInitializeResponse.class));
        HttpEntity<Map<String, Object>> sentEntity = captor.getValue();
        assertThat(sentEntity.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        assertThat(sentEntity.getBody()).containsEntry("reference", "REF-100");
    }

    @Test
    void initializePaymentShouldThrowWhenGatewayRespondsWithFailure() {
        PaymentInitializationRequest request = new PaymentInitializationRequest(
                BigDecimal.TEN,
                "NGN",
                "2",
                "user@example.com",
                "REF-FAIL",
                null,
                null,
                null);

        PaystackInitializeResponse response = new PaystackInitializeResponse(false, "Failure", null);
        when(restTemplate.postForEntity(eq("/transaction/initialize"), any(HttpEntity.class),
                eq(PaystackInitializeResponse.class)))
                .thenReturn(ResponseEntity.badRequest().body(response));

        assertThatThrownBy(() -> paystackClient.initializePayment(request))
                .isInstanceOf(PaymentGatewayException.class)
                .hasMessageContaining("Failed to initialize");
    }

    @Test
    void initializePaymentShouldWrapRestClientExceptions() {
        PaymentInitializationRequest request = new PaymentInitializationRequest(
                BigDecimal.ONE,
                "NGN",
                "3",
                "user@example.com",
                "REF-ERROR",
                null,
                null,
                null);

        when(restTemplate.postForEntity(eq("/transaction/initialize"), any(HttpEntity.class),
                eq(PaystackInitializeResponse.class)))
                .thenThrow(new RestClientException("network error"));

        assertThatThrownBy(() -> paystackClient.initializePayment(request))
                .isInstanceOf(PaymentGatewayException.class)
                .hasMessageContaining("Error initializing");
    }

    @Test
    void verifyPaymentShouldReturnGatewayResponseOnSuccess() {
        PaystackVerifyResponseData data = new PaystackVerifyResponseData(
                "success",
                new BigDecimal("1000.00"),
                "NGN",
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                "REF-VERIFY",
                null);
        PaystackVerifyResponse response = new PaystackVerifyResponse(true, "Approved", data);

        when(restTemplate.exchange(
                eq("/transaction/verify/{reference}"),
                eq(HttpMethod.GET),
                eq(null),
                eq(PaystackVerifyResponse.class),
                eq("REF-VERIFY"))).thenReturn(ResponseEntity.ok(response));

        PaystackVerifyResponse result = paystackClient.verifyPayment("REF-VERIFY");

        assertThat(result).isEqualTo(response);
    }

    @Test
    void verifyPaymentShouldThrowWhenGatewayStatusIsFalse() {
        PaystackVerifyResponse response = new PaystackVerifyResponse(false, "Declined", null);
        when(restTemplate.exchange(
                eq("/transaction/verify/{reference}"),
                eq(HttpMethod.GET),
                eq(null),
                eq(PaystackVerifyResponse.class),
                eq("REF-DECLINE"))).thenReturn(ResponseEntity.ok(response));

        assertThatThrownBy(() -> paystackClient.verifyPayment("REF-DECLINE"))
                .isInstanceOf(PaymentGatewayException.class)
                .hasMessageContaining("verification failed");
    }

    @Test
    void verifyPaymentShouldWrapRestClientExceptions() {
        when(restTemplate.exchange(
                eq("/transaction/verify/{reference}"),
                eq(HttpMethod.GET),
                eq(null),
                eq(PaystackVerifyResponse.class),
                eq("REF-ERR"))).thenThrow(new RestClientException("timeout"));

        assertThatThrownBy(() -> paystackClient.verifyPayment("REF-ERR"))
                .isInstanceOf(PaymentGatewayException.class)
                .hasMessageContaining("Error verifying");
    }

    @Test
    void validateWebhookSignatureShouldSucceedForValidSignature() {
        String payload = "{\"event\":\"charge.success\"}";
        String signature = computeSignature(payload);

        assertDoesNotThrow(() -> paystackClient.validateWebhookSignature(payload, signature));
    }

    @Test
    void validateWebhookSignatureShouldThrowWhenSignatureInvalid() {
        String payload = "{\"event\":\"charge.success\"}";
        String signature = "invalid";

        assertThatThrownBy(() -> paystackClient.validateWebhookSignature(payload, signature))
                .isInstanceOf(InvalidWebhookSignatureException.class)
                .hasMessageContaining("Invalid Paystack webhook signature");
    }

    @Test
    void validateWebhookSignatureShouldThrowWhenSignatureMissing() {
        assertThatThrownBy(() -> paystackClient.validateWebhookSignature("{}", null))
                .isInstanceOf(InvalidWebhookSignatureException.class)
                .hasMessageContaining("Missing Paystack webhook signature");
    }

    @Test
    void parseWebhookEventShouldMapJsonToRecord() {
        String payload = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"REF-123\"}}";

        var event = paystackClient.parseWebhookEvent(payload);

        assertThat(event.event()).isEqualTo("charge.success");
        assertThat(event.data()).containsEntry("reference", "REF-123");
    }

    @Test
    void parseWebhookEventShouldThrowForInvalidJson() {
        String payload = "{invalid";

        assertThatThrownBy(() -> paystackClient.parseWebhookEvent(payload))
                .isInstanceOf(PaymentGatewayException.class)
                .hasMessageContaining("Unable to parse Paystack webhook payload");
    }

    private String computeSignature(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(properties.getSecretKey().getBytes(), "HmacSHA512"));
            return bytesToHex(mac.doFinal(payload.getBytes()));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to compute signature in test", ex);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) {
                hex.append('0');
            }
            hex.append(h);
        }
        return hex.toString();
    }
}
