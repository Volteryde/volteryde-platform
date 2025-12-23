package com.volteryde.payment.service;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.dto.WalletTransactionResponse;
import com.volteryde.payment.entity.WalletBalanceEntity;
import java.math.BigDecimal;
import java.util.List;

public interface WalletService {

	WalletBalanceResponse getBalance(Long customerId);

	List<WalletTransactionResponse> getHistory(Long customerId);

	WalletBalanceEntity credit(Long customerId, BigDecimal amount);

	WalletBalanceEntity debit(Long customerId, BigDecimal amount);
}
