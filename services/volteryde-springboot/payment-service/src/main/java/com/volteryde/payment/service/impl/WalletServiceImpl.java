package com.volteryde.payment.service.impl;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.dto.WalletTransactionResponse;
import com.volteryde.payment.entity.WalletTransactionEntity;
import com.volteryde.payment.model.WalletTransactionType;
import com.volteryde.payment.entity.WalletBalanceEntity;
import com.volteryde.payment.repository.WalletBalanceRepository;
import com.volteryde.payment.repository.WalletTransactionRepository;
import com.volteryde.payment.service.SecurityService;
import com.volteryde.payment.service.WalletService;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletServiceImpl implements WalletService {

	private final WalletBalanceRepository walletBalanceRepository;
	private final WalletTransactionRepository walletTransactionRepository;
	private final SecurityService securityService;

	public WalletServiceImpl(WalletBalanceRepository walletBalanceRepository,
			WalletTransactionRepository walletTransactionRepository,
			SecurityService securityService) {
		this.walletBalanceRepository = walletBalanceRepository;
		this.walletTransactionRepository = walletTransactionRepository;
		this.securityService = securityService;
	}

	@Override
	@Transactional(readOnly = true)
	public WalletBalanceResponse getBalance(Long customerId) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElseGet(() -> createWallet(customerId)); // Create if not exists (signed)

		verifyIntegrity(wallet);

		return new WalletBalanceResponse(customerId, wallet.getTotalBalance(), "GHS");
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
	public WalletBalanceEntity depositRealFunds(Long customerId, BigDecimal amount, String referenceId, String signature) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElseGet(() -> createWallet(customerId));

		verifyIntegrity(wallet);

		wallet.setRealBalance(wallet.getRealBalance().add(amount));

		// Re-sign the balance
		updateSignature(wallet);

		wallet = walletBalanceRepository.save(wallet);

		createTransaction(wallet, amount, WalletTransactionType.CREDIT, "Paystack Deposit: " + referenceId, "REAL", referenceId);
		return wallet;
	}

	@Override
	@Transactional
	public WalletBalanceEntity addSupportFunds(Long customerId, BigDecimal amount, String reason, String adminId) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElseGet(() -> createWallet(customerId));

		verifyIntegrity(wallet);

		wallet.setPromoBalance(wallet.getPromoBalance().add(amount));

		// Re-sign the balance
		updateSignature(wallet);

		wallet = walletBalanceRepository.save(wallet);

		String description = String.format("Support Credit: %s (Admin: %s)", reason, adminId);
		String referenceId = "SUP-" + System.currentTimeMillis();

		createTransaction(wallet, amount, WalletTransactionType.CREDIT, description, "PROMO", referenceId);
		return wallet;
	}

	@Override
	@Transactional
	public WalletBalanceEntity debit(Long customerId, BigDecimal amount, String referenceId) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

		verifyIntegrity(wallet);

		BigDecimal total = wallet.getTotalBalance();
		if (total.compareTo(amount) < 0) {
			throw new IllegalArgumentException("Insufficient balance");
		}

		BigDecimal remaining = amount;

		// 1. Deduct from Promo first
		if (wallet.getPromoBalance().compareTo(BigDecimal.ZERO) > 0) {
			BigDecimal deduction = wallet.getPromoBalance().min(remaining);
			wallet.setPromoBalance(wallet.getPromoBalance().subtract(deduction));
			remaining = remaining.subtract(deduction);
		}

		// 2. Deduct from Real if still needed
		if (remaining.compareTo(BigDecimal.ZERO) > 0) {
			wallet.setRealBalance(wallet.getRealBalance().subtract(remaining));
		}

		// Re-sign the balance
		updateSignature(wallet);

		wallet = walletBalanceRepository.save(wallet);

		createTransaction(wallet, amount, WalletTransactionType.DEBIT, "Ride Payment", "MIXED", referenceId);
		return wallet;
	}

	@Override
	@Transactional
	public WalletBalanceEntity refund(Long customerId, String originalReferenceId, BigDecimal amount) {
		WalletBalanceEntity wallet = walletBalanceRepository.findByCustomerId(customerId)
				.orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

		verifyIntegrity(wallet);

		// Ensure the original transaction exists (optional but good practice)
		// boolean txExists = walletTransactionRepository.existsByReferenceId(originalReferenceId);
		// if (!txExists) throw new IllegalArgumentException("Original transaction not found");

		// Credit Real Balance for Refunds
		wallet.setRealBalance(wallet.getRealBalance().add(amount));

		updateSignature(wallet);
		wallet = walletBalanceRepository.save(wallet);

		String refundRef = "REFUND-" + originalReferenceId + "-" + System.currentTimeMillis();
		createTransaction(wallet, amount, WalletTransactionType.CREDIT, "Refund for: " + originalReferenceId, "REAL", refundRef);

		return wallet;
	}

	@Override
	@Transactional
	public WalletBalanceEntity credit(Long customerId, BigDecimal amount) {
		// Deprecated
		return depositRealFunds(customerId, amount, "LEGACY-" + System.currentTimeMillis(), "mock-sig");
	}

	private WalletBalanceEntity createWallet(Long customerId) {
		WalletBalanceEntity newWallet = new WalletBalanceEntity();
		newWallet.setCustomerId(customerId);
		newWallet.setRealBalance(BigDecimal.ZERO);
		newWallet.setPromoBalance(BigDecimal.ZERO);

		// Sign the initial empty wallet
		updateSignature(newWallet);

		return walletBalanceRepository.save(newWallet);
	}

	private void createTransaction(WalletBalanceEntity wallet, BigDecimal amount, WalletTransactionType type,
			String description, String balanceType, String referenceId) {
		WalletTransactionEntity tx = new WalletTransactionEntity();
		tx.setCustomerId(wallet.getCustomerId());
		tx.setAmount(amount);
		tx.setType(type);
		tx.setDescription(description);
		tx.setBalanceType(balanceType);
		tx.setReferenceId(referenceId);

		String signature = securityService.signTransaction(
				wallet.getCustomerId(),
				amount,
				type.toString(),
				referenceId
		);
		tx.setSignature(signature);

		walletTransactionRepository.save(tx);
	}

	private void verifyIntegrity(WalletBalanceEntity wallet) {
		// New wallets created in this flow are signed.
		// If signature is missing or invalid, freeze.
		if (wallet.getId() != null) { // Only verify existing persisted wallets
			if (!securityService.validateBalance(wallet)) {
				throw new SecurityException("ACCOUNT FROZEN: Wallet integrity check failed for customer " + wallet.getCustomerId());
			}
		}
	}

	private void updateSignature(WalletBalanceEntity wallet) {
		String sig = securityService.signBalance(
				wallet.getCustomerId(),
				wallet.getRealBalance(),
				wallet.getPromoBalance()
		);
		wallet.setSignature(sig);
	}
}
