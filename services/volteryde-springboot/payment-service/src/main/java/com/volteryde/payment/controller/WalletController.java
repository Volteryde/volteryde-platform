package com.volteryde.payment.controller;

import com.volteryde.payment.dto.WalletBalanceResponse;
import com.volteryde.payment.dto.WalletTransactionResponse;
import com.volteryde.payment.dto.WalletOperationRequest;
import com.volteryde.payment.service.PaymentService;
import com.volteryde.payment.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/wallet")
public class WalletController {

	private final WalletService walletService;
	private final PaymentService paymentService;

	@org.springframework.beans.factory.annotation.Value("${volteryde.internal.service-key:}")
	private String internalServiceKey;

	public WalletController(WalletService walletService, PaymentService paymentService) {
		this.walletService = walletService;
		this.paymentService = paymentService;
	}

	@GetMapping("/balance")
	public ResponseEntity<WalletBalanceResponse> getBalance(HttpServletRequest request) {
		String customerId = getAuthenticatedUserId(request);
		if (customerId == null) {
			return ResponseEntity.status(401).build();
		}
		return ResponseEntity.ok(walletService.getBalance(customerId));
	}

	@GetMapping("/{customerId}/balance")
	public ResponseEntity<WalletBalanceResponse> internalGetBalance(
			@PathVariable String customerId,
			@RequestHeader(value = "X-Internal-Service-Key", required = false) String internalKey) {
		// Verify internal service key
		if (internalServiceKey == null || internalServiceKey.isBlank() || !internalServiceKey.equals(internalKey)) {
			return ResponseEntity.status(403).build();
		}
		return ResponseEntity.ok(walletService.getBalance(customerId));
	}

	@GetMapping("/transactions")
	public ResponseEntity<List<WalletTransactionResponse>> getHistory(HttpServletRequest request) {
		String customerId = getAuthenticatedUserId(request);
		if (customerId == null) {
			return ResponseEntity.status(401).build();
		}
		return ResponseEntity.ok(walletService.getHistory(customerId));
	}

	@PostMapping("/topup")
	public ResponseEntity<com.volteryde.payment.dto.WalletTopupResponse> topup(
			@RequestBody @jakarta.validation.Valid com.volteryde.payment.dto.WalletTopupRequest request,
			HttpServletRequest httpRequest) {
		String customerId = getAuthenticatedUserId(httpRequest);
		if (customerId == null) {
			return ResponseEntity.status(401).build();
		}
		return ResponseEntity.ok(paymentService.topupWallet(customerId, request));
	}

	@PostMapping("/deduct")
	public ResponseEntity<?> deduct(@RequestBody WalletOperationRequest request) {
		// Internal API
		return ResponseEntity.ok(walletService.debit(request.userId(), request.amount(), request.referenceId()));
	}

	@PostMapping("/credit")
	public ResponseEntity<?> credit(@RequestBody WalletOperationRequest request) {
		// Internal API
		String sig = "INTERNAL-SIG-" + System.currentTimeMillis();
		return ResponseEntity
				.ok(walletService.depositRealFunds(request.userId(), request.amount(), request.referenceId(), sig));
	}

	@PostMapping("/refund")
	public ResponseEntity<?> refund(@RequestBody WalletOperationRequest request) {
		// Internal API
		if (request.originalReferenceId() == null) {
			return ResponseEntity.badRequest().body("originalReferenceId is required");
		}
		return ResponseEntity.ok(walletService.refund(request.userId(), request.originalReferenceId(), request.amount()));
	}

	private String getAuthenticatedUserId(HttpServletRequest request) {
		// Try request attribute first (set by auth filter)
		Object attrId = request.getAttribute("authenticatedUserId");
		if (attrId != null) {
			return attrId.toString();
		}

		// Try X-User-Id header
		String headerId = request.getHeader("X-User-Id");
		if (headerId != null && !headerId.isBlank()) {
			return headerId;
		}
		return null;
	}
}
