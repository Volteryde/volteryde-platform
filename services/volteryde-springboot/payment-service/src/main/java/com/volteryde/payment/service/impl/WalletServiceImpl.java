package com.volteryde.payment.service.impl;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.dto.WalletTransactionResponse;
import com.volteryde.payment.dto.WalletTopupRequest;
import com.volteryde.payment.dto.WalletTopupResponse;
import com.volteryde.payment.entity.WalletTransactionEntity;
import com.volteryde.payment.model.WalletTransactionType;
import com.volteryde.payment.entity.WalletBalanceEntity;
import com.volteryde.payment.repository.WalletBalanceRepository;
import com.volteryde.payment.repository.WalletTransactionRepository;
import com.volteryde.payment.service.WalletService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletServiceImpl implements WalletService {

	private final WalletBalanceRepository walletBalanceRepository;
	private final WalletTransactionRepository walletTransactionRepository;

	public WalletServiceImpl(WalletBalanceRepository walletBalanceRepository,
			WalletTransactionRepository walletTransactionRepository) {
		this.walletBalanceRepository = walletBalanceRepository;
		this.walletTransactionRepository = walletTransactionRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public WalletBalanceResponse getBalance(Long customerId) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElse(new WalletBalanceEntity());

		BigDecimal balance = wallet.getBalance() != null ? wallet.getBalance() : BigDecimal.ZERO;

		return new WalletBalanceResponse(customerId, balance, "GHS");
	}

	@Override
	@Transactional(readOnly = true)
	public List<WalletTransactionResponse> getHistory(Long customerId) {
		return walletTransactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
				.stream()
				.map(tx -> new WalletTransactionResponse(
						tx.getId(),
						tx.getAmount(),
						tx.getType(),
						tx.getDescription(),
						tx.getCreatedAt()))
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public WalletBalanceEntity credit(Long customerId, BigDecimal amount) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElseGet(() -> createWallet(customerId));

		wallet.setBalance(wallet.getBalance().add(amount));
		wallet = walletBalanceRepository.save(wallet);

		createTransaction(wallet, amount, WalletTransactionType.CREDIT, "Credit");
		return wallet;
	}

	@Override
	@Transactional
	public WalletBalanceEntity debit(Long customerId, BigDecimal amount) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

		if (wallet.getBalance().compareTo(amount) < 0) {
			throw new IllegalArgumentException("Insufficient balance");
		}

		wallet.setBalance(wallet.getBalance().subtract(amount));
		wallet = walletBalanceRepository.save(wallet);

		createTransaction(wallet, amount, WalletTransactionType.DEBIT, "Debit");
		return wallet;
	}

	private WalletBalanceEntity createWallet(Long customerId) {
		WalletBalanceEntity newWallet = new WalletBalanceEntity();
		newWallet.setCustomerId(customerId);
		newWallet.setBalance(BigDecimal.ZERO);
		return walletBalanceRepository.save(newWallet);
	}

	private void createTransaction(WalletBalanceEntity wallet, BigDecimal amount, WalletTransactionType type,
			String description) {
		WalletTransactionEntity tx = new WalletTransactionEntity();
		tx.setCustomerId(wallet.getCustomerId()); // Assuming WalletTransactionEntity uses customerId, not a Wallet object
		tx.setAmount(amount);
		tx.setType(type);
		tx.setDescription(description);
		walletTransactionRepository.save(tx);
	}
}
