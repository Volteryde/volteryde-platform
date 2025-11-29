package com.volteryde.payment.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.volteryde.payment.config.PaystackProperties;
import com.volteryde.payment.dto.PaymentInitializationRequest;
import com.volteryde.payment.dto.PaymentInitializationResponse;
import com.volteryde.payment.exception.InvalidWebhookSignatureException;
import com.volteryde.payment.exception.PaymentGatewayException;
import com.volteryde.payment.service.PaymentGatewayClient;
import com.volteryde.payment.service.model.PaystackInitializeResponse;
import com.volteryde.payment.service.model.PaystackInitializeResponseData;
import com.volteryde.payment.service.model.PaystackVerifyResponse;
import com.volteryde.payment.service.model.PaystackWebhookEvent;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class PaystackPaymentGatewayClient implements PaymentGatewayClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaystackPaymentGatewayClient.class);
    private static final String INITIALIZE_ENDPOINT = "/transaction/initialize";
    private static final String VERIFY_ENDPOINT = "/transaction/verify/{reference}";

    private final RestTemplate restTemplate;
    private final PaystackProperties properties;
    private final ObjectMapper objectMapper;

    public PaystackPaymentGatewayClient(RestTemplate restTemplate, PaystackProperties properties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public PaymentInitializationResponse initializePayment(PaymentInitializationRequest request) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", toLowestDenomination(request.amount()));
            payload.put("email", request.customerEmail());
            payload.put("reference", request.reference());
            payload.put("currency", request.currency());
            if (request.callbackUrl() != null) {
                payload.put("callback_url", request.callbackUrl());
            } else if (properties.getCallbackUrl() != null) {
                payload.put("callback_url", properties.getCallbackUrl());
            }
            if (request.metadata() != null) {
                payload.put("metadata", request.metadata());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<PaystackInitializeResponse> response = restTemplate.postForEntity(
                INITIALIZE_ENDPOINT,
                entity,
                PaystackInitializeResponse.class
            );

            PaystackInitializeResponse responseBody = response.getBody();
            if (responseBody == null || !responseBody.status()) {
                throw new PaymentGatewayException("Failed to initialize Paystack payment: " +
                    (responseBody != null ? responseBody.message() : "no response body"));
            }

            PaystackInitializeResponseData data = responseBody.data();
            if (data == null) {
                throw new PaymentGatewayException("Paystack initialization response missing data");
            }

            return new PaymentInitializationResponse(
                data.reference(),
                data.authorizationUrl(),
                data.accessCode(),
                null
            );
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("Error initializing Paystack payment", ex);
        }
    }

    @Override
    public PaystackVerifyResponse verifyPayment(String reference) {
        try {
            ResponseEntity<PaystackVerifyResponse> response = restTemplate.exchange(
                VERIFY_ENDPOINT,
                HttpMethod.GET,
                null,
                PaystackVerifyResponse.class,
                reference
            );

            PaystackVerifyResponse responseBody = response.getBody();
            if (responseBody == null) {
                throw new PaymentGatewayException("Paystack verification returned empty body");
            }

            if (!responseBody.status()) {
                throw new PaymentGatewayException("Paystack verification failed: " + responseBody.message());
            }

            return responseBody;
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("Error verifying Paystack payment", ex);
        }
    }

    @Override
    public void validateWebhookSignature(String payload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new InvalidWebhookSignatureException("Missing Paystack webhook signature header");
        }

        String computedSignature = computeHmacSha512(payload);
        if (!signatureHeader.equalsIgnoreCase(computedSignature)) {
            throw new InvalidWebhookSignatureException("Invalid Paystack webhook signature");
        }
    }

    @Override
    public PaystackWebhookEvent parseWebhookEvent(String payload) {
        try {
            return objectMapper.readValue(payload, PaystackWebhookEvent.class);
        } catch (JsonProcessingException ex) {
            LOGGER.error("Failed to parse Paystack webhook payload", ex);
            throw new PaymentGatewayException("Unable to parse Paystack webhook payload", ex);
        }
    }

    private long toLowestDenomination(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).longValueExact();
    }

    private String computeHmacSha512(String payload) {
        try {
            Mac hmacSha512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                properties.getSecretKey().getBytes(StandardCharsets.UTF_8),
                "HmacSHA512"
            );
            hmacSha512.init(secretKey);
            byte[] rawHmac = hmacSha512.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(rawHmac);
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new PaymentGatewayException("Unable to compute Paystack webhook signature", ex);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
