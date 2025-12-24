package com.volteryde.payment.service.impl;

import com.volteryde.payment.service.SecurityService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class SecurityServiceImpl implements SecurityService {

    @Value("${wallet.security.secret-key:default-secret-change-me-in-prod}")
    private String secretKey;

    private static final String ALGORITHM = "HmacSHA256";

    @Override
    public String signTransaction(Long customerId, BigDecimal amount, String type, String referenceId) {
        try {
            String data = String.format("%d|%s|%s|%s", customerId, amount.toPlainString(), type, referenceId);
            Mac sha256_HMAC = Mac.getInstance(ALGORITHM);
            SecretKeySpec secret_key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            sha256_HMAC.init(secret_key);

            return Base64.getEncoder().encodeToString(sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Error signing transaction", e);
        }
    }

    @Override
    public boolean validateTransaction(Long customerId, BigDecimal amount, String type, String referenceId, String signature) {
        String calculatedSignature = signTransaction(customerId, amount, type, referenceId);
        return calculatedSignature.equals(signature);
    }
}
