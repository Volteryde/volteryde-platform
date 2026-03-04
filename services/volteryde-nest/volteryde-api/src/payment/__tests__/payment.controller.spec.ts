import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentController } from '../payment.controller';
import { PaymentService } from '../payment.service';
import { TransactionType, TransactionStatus } from '../entities/transaction.entity';

// Mock ESM-only deps used by PaymentService internals (not needed for controller tests)
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('axios');

describe('PaymentController', () => {
	let controller: PaymentController;
	let paymentService: jest.Mocked<Partial<PaymentService>>;

	beforeEach(async () => {
		paymentService = {
			getWalletBalance: jest.fn(),
			getTransactionHistory: jest.fn(),
			initializeTopUp: jest.fn(),
			handleWebhook: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [PaymentController],
			providers: [
				{ provide: PaymentService, useValue: paymentService },
				// Austin: ConfigService needed by InternalServiceGuard used on internal/* endpoints
				{ provide: ConfigService, useValue: { get: jest.fn() } },
			],
		}).compile();

		controller = module.get<PaymentController>(PaymentController);
	});

	describe('getWalletBalance', () => {
		it('should return balance in standardized format with realBalance, promoBalance, totalBalance', async () => {
			paymentService.getWalletBalance.mockResolvedValue(100.5);

			const req = { headers: {} } as any;
			const result = await controller.getWalletBalance({ uid: 'user-123' }, req);

			expect(result).toEqual({
				customerId: 'user-123',
				realBalance: 100.5,
				promoBalance: 0,
				totalBalance: 100.5,
				currency: 'GHS',
			});
			expect(paymentService.getWalletBalance).toHaveBeenCalledWith('user-123');
		});

		it('should return zero balance when wallet has no funds', async () => {
			paymentService.getWalletBalance.mockResolvedValue(0);

			const req = { headers: {} } as any;
			const result = await controller.getWalletBalance({ uid: 'user-456' }, req);

			expect(result.totalBalance).toBe(0);
			expect(result.realBalance).toBe(0);
		});

		it('should resolve user from X-User-Id header when CurrentUser has no uid', async () => {
			paymentService.getWalletBalance.mockResolvedValue(50);

			const req = { headers: { 'x-user-id': 'header-user-789' } } as any;
			const result = await controller.getWalletBalance({}, req);

			expect(result.customerId).toBe('header-user-789');
			expect(paymentService.getWalletBalance).toHaveBeenCalledWith('header-user-789');
		});

		it('should throw UnauthorizedException when no user identity found', async () => {
			const req = { headers: {} } as any;

			await expect(controller.getWalletBalance(null, req)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('getTransactions', () => {
		it('should return transaction history for a user', async () => {
			const mockTransactions = [
				{ id: 'tx-1', amount: 50, type: TransactionType.CREDIT, status: TransactionStatus.SUCCESS, description: 'Top-up via Paystack', createdAt: new Date() },
				{ id: 'tx-2', amount: 12, type: TransactionType.DEBIT, status: TransactionStatus.SUCCESS, description: 'Wallet Debit', createdAt: new Date() },
			];
			paymentService.getTransactionHistory.mockResolvedValue(mockTransactions);

			const req = { headers: {} } as any;
			const result = await controller.getTransactions({ uid: 'user-123' }, req, '50');

			expect(result).toEqual(mockTransactions);
			expect(paymentService.getTransactionHistory).toHaveBeenCalledWith('user-123', 50);
		});

		it('should default to 50 results when no limit specified', async () => {
			paymentService.getTransactionHistory.mockResolvedValue([]);

			const req = { headers: {} } as any;
			await controller.getTransactions({ uid: 'user-123' }, req, undefined);

			expect(paymentService.getTransactionHistory).toHaveBeenCalledWith('user-123', 50);
		});

		it('should cap limit at 100', async () => {
			paymentService.getTransactionHistory.mockResolvedValue([]);

			const req = { headers: {} } as any;
			await controller.getTransactions({ uid: 'user-123' }, req, '500');

			expect(paymentService.getTransactionHistory).toHaveBeenCalledWith('user-123', 100);
		});

		it('should throw UnauthorizedException when no user identity found', async () => {
			const req = { headers: {} } as any;

			await expect(controller.getTransactions(null, req)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});
});
