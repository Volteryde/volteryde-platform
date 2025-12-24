package com.volteryde.payment.service.impl;

import com.volteryde.payment.entity.WalletBalanceEntity;
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
        String data = String.format("%d|%s|%s|%s", customerId, amount.toPlainString(), type, referenceId);
        return generateHmac(data);
    }

    @Override
    public boolean validateTransaction(Long customerId, BigDecimal amount, String type, String referenceId, String signature) {
        String calculatedSignature = signTransaction(customerId, amount, type, referenceId);
        return calculatedSignature.equals(signature);
    }

    @Override
    public String signBalance(Long customerId, BigDecimal realBalance, BigDecimal promoBalance) {
        // We sign the combination of ID and both balances
        String data = String.format("%d|%s|%s",
            customerId,
            realBalance != null ? realBalance.toPlainString() : "0",
            promoBalance != null ? promoBalance.toPlainString() : "0"
        );
        return generateHmac(data);
    }

    @Override
    public boolean validateBalance(WalletBalanceEntity wallet) {
        if (wallet.getSignature() == null) {
            // New wallets or pre-migration wallets might not have signature.
            // In strict mode, this should fail. For migration, we might sign it now.
            // Here we assume strict mode for security.
            return false;
        }
        String calculated = signBalance(wallet.getCustomerId(), wallet.getRealBalance(), wallet.getPromoBalance());
        return calculated.equals(wallet.getSignature());
    }

    private String generateHmac(String data) {
        try {
            Mac sha256_HMAC = Mac.getInstance(ALGORITHM);
            SecretKeySpec secret_key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            sha256_HMAC.init(secret_key);

            return Base64.getEncoder().encodeToString(sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Error signing data", e);
        }
    }
}
