package com.volteryde.payment.service.impl;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.entity.WalletBalanceEntity;
import com.volteryde.payment.entity.WalletTransactionEntity;
import com.volteryde.payment.model.WalletTransactionType;
import com.volteryde.payment.repository.WalletBalanceRepository;
import com.volteryde.payment.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class WalletServiceTest {

	@Mock
	private WalletBalanceRepository walletBalanceRepository;

	@Mock
	private WalletTransactionRepository walletTransactionRepository;

	@InjectMocks
	private WalletServiceImpl walletService;

	private WalletBalanceEntity wallet;

	@BeforeEach
	void setUp() {
		wallet = new WalletBalanceEntity();
		wallet.setId(1L);
		wallet.setCustomerId(100L);
		wallet.setBalance(new BigDecimal("100.00"));
	}

	@Test
	void getBalance_ShouldReturnBalance_WhenWalletExists() {
		when(walletBalanceRepository.findByCustomerId(100L)).thenReturn(Optional.of(wallet));

		WalletBalanceResponse response = walletService.getBalance(100L);

		assertNotNull(response);
		assertEquals(new BigDecimal("100.00"), response.balance());
		assertEquals("GHS", response.currency());
	}

	@Test
	void getBalance_ShouldReturnZero_WhenWalletDoesNotExist() {
		when(walletBalanceRepository.findByCustomerId(100L)).thenReturn(Optional.empty());

		WalletBalanceResponse response = walletService.getBalance(100L);

		assertNotNull(response);
		assertEquals(BigDecimal.ZERO, response.balance());
	}

	@Test
	void credit_ShouldIncreaseBalance_AndCreateTransaction() {
		when(walletBalanceRepository.findByCustomerId(100L)).thenReturn(Optional.of(wallet));
		when(walletBalanceRepository.save(any(WalletBalanceEntity.class))).thenAnswer(i -> i.getArguments()[0]);

		WalletBalanceEntity updatedWallet = walletService.credit(100L, new BigDecimal("50.00"));

		assertEquals(new BigDecimal("150.00"), updatedWallet.getBalance());
		verify(walletTransactionRepository).save(any(WalletTransactionEntity.class));
	}

	@Test
	void credit_ShouldCreateWallet_WhenNotExists() {
		when(walletBalanceRepository.findByCustomerId(100L)).thenReturn(Optional.empty());
		when(walletBalanceRepository.save(any(WalletBalanceEntity.class))).thenAnswer(i -> {
			WalletBalanceEntity w = (WalletBalanceEntity) i.getArguments()[0];
			if (w.getBalance() == null)
				w.setBalance(BigDecimal.ZERO);
			return w;
		});

		WalletBalanceEntity updatedWallet = walletService.credit(100L, new BigDecimal("50.00"));

		assertEquals(new BigDecimal("50.00"), updatedWallet.getBalance());
	}

	@Test
	void debit_ShouldDecreaseBalance_WhenFundsSufficient() {
		when(walletBalanceRepository.findByCustomerId(100L)).thenReturn(Optional.of(wallet));
		when(walletBalanceRepository.save(any(WalletBalanceEntity.class))).thenAnswer(i -> i.getArguments()[0]);

		WalletBalanceEntity updatedWallet = walletService.debit(100L, new BigDecimal("50.00"));

		assertEquals(new BigDecimal("50.00"), updatedWallet.getBalance());
		verify(walletTransactionRepository).save(argThat(
				tx -> tx.getType() == WalletTransactionType.DEBIT && tx.getAmount().equals(new BigDecimal("50.00"))));
	}

	@Test
	void debit_ShouldThrowException_WhenFundsInsufficient() {
		when(walletBalanceRepository.findByCustomerId(100L)).thenReturn(Optional.of(wallet));

		assertThrows(IllegalArgumentException.class, () -> walletService.debit(100L, new BigDecimal("150.00")));
		verify(walletBalanceRepository, never()).save(any());
	}
}
