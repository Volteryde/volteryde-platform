package com.volteryde.payment.controller;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.dto.WalletTransactionResponse;
import com.volteryde.payment.service.PaymentService;
import com.volteryde.payment.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/wallet")
public class WalletController {

	private final WalletService walletService;
	private final PaymentService paymentService;

	public WalletController(WalletService walletService, PaymentService paymentService) {
		this.walletService = walletService;
		this.paymentService = paymentService;
	}

	@GetMapping("/balance")
	public ResponseEntity<WalletBalanceResponse> getBalance(HttpServletRequest request) {
		Long customerId = getAuthenticatedUserId(request);
		if (customerId == null) {
			return ResponseEntity.status(401).build();
		}
		return ResponseEntity.ok(walletService.getBalance(customerId));
	}

	@GetMapping("/transactions")
	public ResponseEntity<List<WalletTransactionResponse>> getHistory(HttpServletRequest request) {
		Long customerId = getAuthenticatedUserId(request);
		if (customerId == null) {
			return ResponseEntity.status(401).build();
		}
		return ResponseEntity.ok(walletService.getHistory(customerId));
	}

	@org.springframework.web.bind.annotation.PostMapping("/topup")
	public ResponseEntity<com.volteryde.payment.dto.WalletTopupResponse> topup(
			@org.springframework.web.bind.annotation.RequestBody @jakarta.validation.Valid com.volteryde.payment.dto.WalletTopupRequest request,
			HttpServletRequest httpRequest) {
		Long customerId = getAuthenticatedUserId(httpRequest);
		if (customerId == null) {
			return ResponseEntity.status(401).build();
		}
		return ResponseEntity.ok(paymentService.topupWallet(customerId, request));
	}

	private Long getAuthenticatedUserId(HttpServletRequest request) {
		Long attrId = (Long) request.getAttribute("authenticatedUserId");
		if (attrId != null)
			return attrId;

		// Fallback for direct testing with header
		String headerId = request.getHeader("X-User-Id");
		if (headerId != null) {
			try {
				return Long.parseLong(headerId);
			} catch (NumberFormatException e) {
				return null;
			}
		}
		return null;
	}
}
