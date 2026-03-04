import {
	Injectable,
	Logger,
	BadRequestException,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Wallet } from './entities/wallet.entity';
import {
	Transaction,
	TransactionStatus,
	TransactionType,
} from './entities/transaction.entity';
import { InitializeTopUpDto } from './dto/payment.dto';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class PaymentService {
	private readonly logger = new Logger(PaymentService.name);
	private readonly paystackSecretKey: string;
	private readonly paystackBaseUrl = 'https://api.paystack.co';

	// In-memory balance cache: userId -> { balance, expiresAt }
	private readonly balanceCache = new Map<string, { balance: number; expiresAt: number }>();
	private readonly CACHE_TTL_MS = 30_000; // 30 seconds

	constructor(
		@InjectRepository(Wallet)
		private readonly walletRepository: Repository<Wallet>,
		@InjectRepository(Transaction)
		private readonly transactionRepository: Repository<Transaction>,
		private readonly configService: ConfigService,
		@InjectDataSource() private readonly dataSource: DataSource,
	) {
		this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
		if (!this.paystackSecretKey) {
			this.logger.warn('PAYSTACK_SECRET_KEY is not defined in environment variables');
		}
	}

	/**
	 * Initialize a Paystack transaction to fund the user's wallet.
	 */
	async initializeTopUp(userId: string, dto: InitializeTopUpDto) {
		if (dto.amount < 12) {
			throw new BadRequestException('Minimum funding amount is 12 GHS');
		}

		// 1. Ensure wallet exists
		let wallet = await this.walletRepository.findOne({ where: { userId } });
		if (!wallet) {
			wallet = this.walletRepository.create({ userId, balance: 0 });
			await this.walletRepository.save(wallet);
		}

		// 2. Create a pending transaction record
		const reference = `TRX-${uuidv4()}`;
		const transaction = this.transactionRepository.create({
			wallet,
			amount: dto.amount,
			reference,
			status: TransactionStatus.PENDING,
			type: TransactionType.CREDIT,
			metadata: {
				source: 'paystack',
				initializedAt: new Date(),
			},
		});
		await this.transactionRepository.save(transaction);

		// 3. Call Paystack Initialize API
		try {
			// Paystack expects amount in lowest denomination (kobo/pesewas). 1 GHS = 100 pesewas.
			const amountInKobo = Math.round(dto.amount * 100);

			const response = await axios.post(
				`${this.paystackBaseUrl}/transaction/initialize`,
				{
					email: dto.email || `user-${userId}@volteryde.com`, // Fallback email if not provided
					amount: amountInKobo,
					reference: reference, // Pass our unique reference
					currency: 'GHS',
					channels: ['card', 'mobile_money'],
					// Austin: Paystack redirects here after checkout completes.
					// Our callback endpoint returns a friendly "Payment Successful" HTML page.
					callback_url: `https://api.volteryde.com/api/v1/wallet/callback`,
					metadata: {
						custom_fields: [
							{
								display_name: 'User ID',
								variable_name: 'user_id',
								value: userId,
							},
						],
					},
				},
				{
					headers: {
						Authorization: `Bearer ${this.paystackSecretKey}`,
						'Content-Type': 'application/json',
					},
				}
			);

			return {
				authorizationUrl: response.data.data.authorization_url,
				accessCode: response.data.data.access_code,
				referenceId: response.data.data.reference,
			};
		} catch (error) {
			this.logger.error('Failed to initialize Paystack transaction', error.response?.data || error.message);
			// Mark transaction as failed or abandoned? For now, leave as pending or mark failed.
			await this.transactionRepository.update({ id: transaction.id }, { status: TransactionStatus.FAILED });
			throw new InternalServerErrorException('Payment initialization failed');
		}
	}

	/**
	 * Handle Paystack Webhook
	 */
	async handleWebhook(signature: string, payload: any) {
		const { event, data } = payload;
		this.logger.log(`Webhook received: event=${event} reference=${data?.reference}`);

		// 1. Verify Signature
		if (!this.paystackSecretKey) {
			this.logger.error('PAYSTACK_SECRET_KEY is not set — cannot verify webhook signature');
			throw new BadRequestException('Webhook verification not configured');
		}

		const hash = crypto
			.createHmac('sha512', this.paystackSecretKey)
			.update(JSON.stringify(payload))
			.digest('hex');

		if (hash !== signature) {
			this.logger.error(
				`Webhook signature mismatch for reference=${data?.reference}. ` +
				`Received: ${signature?.substring(0, 16)}... Expected: ${hash.substring(0, 16)}...`
			);
			throw new BadRequestException('Invalid signature');
		}

		// 2. Handle 'charge.success'
		if (event === 'charge.success') {
			try {
				const result = await this.processSuccessfulCharge(data);
				this.logger.log(`Webhook processed: event=${event} reference=${data?.reference} result=${JSON.stringify(result)}`);
				return result;
			} catch (err) {
				this.logger.error(
					`Webhook processing failed: event=${event} reference=${data?.reference} error=${err?.message}`,
					err?.stack,
				);
				throw err;
			}
		}

		this.logger.log(`Webhook ignored: event=${event} (no handler)`);
		return { status: 'ignored', message: 'Event not handled' };
	}

	/**
	 * Process successful charge atomically.
	 * Handles both backend-initialized transactions (pre-created DB record) and
	 * client-initiated transactions (no pre-created record — reference = VLTRD-{userId}-{ts}).
	 */
	private async processSuccessfulCharge(data: any) {
		const reference = data.reference as string;
		const amountPaid = data.amount / 100; // Convert pesewas → GHS

		this.logger.log(`Processing successful charge for reference: ${reference}`);

		return await this.dataSource.manager.transaction(async (manager: EntityManager) => {
			// Austin: Find transaction WITH relations but WITHOUT lock to avoid
			// PostgreSQL "FOR UPDATE cannot be applied to nullable side of outer join" error.
			// TypeORM translates relations: ['wallet'] into LEFT JOIN, which is incompatible with FOR UPDATE.
			const existingRecord = await manager.findOne(Transaction, {
				where: { reference },
				relations: ['wallet'],
			});

			if (existingRecord) {
				// ── Backend-initialized flow ──────────────────────────────
				if (existingRecord.status === TransactionStatus.SUCCESS) {
					this.logger.log(`Transaction ${reference} already processed`);
					return { status: 'success', message: 'Already processed' };
				}

				// Austin: Lock transaction row individually (no JOIN = no LEFT JOIN issue)
				const lockedTx = await manager.findOne(Transaction, {
					where: { id: existingRecord.id },
					lock: { mode: 'pessimistic_write' },
				});

				if (Math.abs(lockedTx.amount - amountPaid) > 0.01) {
					this.logger.warn(`Amount mismatch for ${reference}: expected ${lockedTx.amount}, got ${amountPaid}`);
					lockedTx.status = TransactionStatus.FAILED;
					lockedTx.metadata = { ...lockedTx.metadata, failureReason: 'Amount mismatch' };
					await manager.save(lockedTx);
					return;
				}

				lockedTx.status = TransactionStatus.SUCCESS;
				lockedTx.externalReference = data.id?.toString();
				lockedTx.metadata = { ...lockedTx.metadata, paystackData: data };
				await manager.save(lockedTx);

				// Austin: Lock wallet separately using the ID from the pre-loaded relation
				const lockedWallet = await manager.findOne(Wallet, {
					where: { id: existingRecord.wallet.id },
					lock: { mode: 'pessimistic_write' },
				});
				const newBalance = Number(lockedWallet.balance) + amountPaid;
				lockedWallet.balance = newBalance;
				await manager.save(lockedWallet);

				this.logger.log(`Wallet credited (backend-init) for user ${lockedWallet.userId}. Balance: ${newBalance}`);
				this.invalidateBalanceCache(lockedWallet.userId);
				return { status: 'success' };
			}

			// ── Client-initiated flow ─────────────────────────────────────
			// Reference format: VLTRD-{firebaseUserId}-{timestamp}
			// Metadata may also carry userId as data.metadata.userId
			const userId: string | undefined =
				data.metadata?.userId ||
				(reference.startsWith('VLTRD-') ? reference.split('-').slice(1, -1).join('-') : undefined);

			if (!userId) {
				this.logger.error(`Cannot identify user for client-initiated charge. Reference: ${reference}`);
				return;
			}

			// Idempotency: check if we already created a SUCCESS record for this reference
			const alreadyProcessed = await manager.findOne(Transaction, { where: { reference } });
			if (alreadyProcessed) {
				this.logger.log(`Client-initiated transaction ${reference} already processed`);
				return { status: 'success', message: 'Already processed' };
			}

			// Find or create wallet
			let wallet = await manager.findOne(Wallet, {
				where: { userId },
				lock: { mode: 'pessimistic_write' },
			});
			if (!wallet) {
				wallet = manager.create(Wallet, { userId, balance: 0 });
				await manager.save(wallet);
			}

			// Create and save the transaction record
			const txRecord = manager.create(Transaction, {
				wallet,
				amount: amountPaid,
				reference,
				externalReference: data.id?.toString(),
				status: TransactionStatus.SUCCESS,
				type: TransactionType.CREDIT,
				metadata: { source: 'paystack', paystackData: data, clientInitiated: true },
			});
			await manager.save(txRecord);

			// Credit wallet
			const newBalance = Number(wallet.balance) + amountPaid;
			wallet.balance = newBalance;
			await manager.save(wallet);

			this.logger.log(`Wallet credited (client-init) for user ${userId}. Balance: ${newBalance}`);
			this.invalidateBalanceCache(userId);
			return { status: 'success' };
		});
	}

	// ─── Internal Wallet Operations (called by Temporal activities) ─────────────

	async internalGetBalance(userId: string) {
		const balance = await this.getWalletBalance(userId);
		return { userId, balance, currency: 'GHS' };
	}

	async internalDeduct(userId: string, amount: number, referenceId: string, reason: string) {
		this.logger.log(`[INTERNAL] Deducting ${amount} GHS from user ${userId} for ref ${referenceId}`);

		return await this.dataSource.manager.transaction(async (manager: EntityManager) => {
			const wallet = await manager.findOne(Wallet, {
				where: { userId },
				lock: { mode: 'pessimistic_write' },
			});

			if (!wallet) {
				throw new BadRequestException(`Wallet not found for user ${userId}`);
			}

			const currentBalance = Number(wallet.balance);
			if (currentBalance < amount) {
				return {
					transactionId: null,
					userId,
					amount,
					currency: 'GHS',
					status: 'FAILED',
					failureReason: `Insufficient balance: ${currentBalance} < ${amount}`,
				};
			}

			wallet.balance = currentBalance - amount;
			await manager.save(wallet);

			const tx = manager.create(Transaction, {
				wallet,
				amount,
				reference: referenceId,
				status: TransactionStatus.SUCCESS,
				type: TransactionType.DEBIT,
				metadata: { source: 'temporal-booking', reason },
			});
			await manager.save(tx);

			this.invalidateBalanceCache(userId);
			this.logger.log(`[INTERNAL] Deducted ${amount} GHS from ${userId}. New balance: ${wallet.balance}`);

			return {
				transactionId: tx.id,
				userId,
				amount,
				currency: 'GHS',
				status: 'SUCCESS',
			};
		});
	}

	async internalCredit(userId: string, amount: number, referenceId: string, reason: string) {
		this.logger.log(`[INTERNAL] Crediting ${amount} GHS to user ${userId} for ref ${referenceId}`);

		return await this.dataSource.manager.transaction(async (manager: EntityManager) => {
			let wallet = await manager.findOne(Wallet, {
				where: { userId },
				lock: { mode: 'pessimistic_write' },
			});

			if (!wallet) {
				wallet = manager.create(Wallet, { userId, balance: 0 });
				await manager.save(wallet);
			}

			wallet.balance = Number(wallet.balance) + amount;
			await manager.save(wallet);

			const tx = manager.create(Transaction, {
				wallet,
				amount,
				reference: referenceId,
				status: TransactionStatus.SUCCESS,
				type: TransactionType.CREDIT,
				metadata: { source: 'temporal-booking', reason },
			});
			await manager.save(tx);

			this.invalidateBalanceCache(userId);
			this.logger.log(`[INTERNAL] Credited ${amount} GHS to ${userId}. New balance: ${wallet.balance}`);

			return {
				transactionId: tx.id,
				userId,
				amount,
				currency: 'GHS',
				status: 'SUCCESS',
			};
		});
	}

	async internalRefund(userId: string, amount: number, originalReferenceId: string, reason: string) {
		return this.internalCredit(userId, amount, `REFUND-${originalReferenceId}`, reason);
	}

	// ─── Public Wallet Operations ─────────────────────────────────────────────

	async getWalletBalance(userId: string) {
		const cached = this.balanceCache.get(userId);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.balance;
		}

		const wallet = await this.walletRepository.findOne({ where: { userId } });
		const balance = wallet ? Number(wallet.balance) : 0;

		this.balanceCache.set(userId, { balance, expiresAt: Date.now() + this.CACHE_TTL_MS });
		return balance;
	}

	private invalidateBalanceCache(userId: string) {
		this.balanceCache.delete(userId);
	}

	// Austin: Return ALL statuses (SUCCESS, FAILED, PENDING, ABANDONED) + bonus flag
	async getTransactionHistory(userId: string, limit = 50) {
		const wallet = await this.walletRepository.findOne({ where: { userId } });
		if (!wallet) {
			return [];
		}

		const transactions = await this.transactionRepository.find({
			where: { wallet: { id: wallet.id } },
			order: { createdAt: 'DESC' },
			take: limit,
		});

		return transactions.map((tx) => ({
			id: tx.id,
			amount: Number(tx.amount),
			type: tx.type,
			status: tx.status,
			description: this.buildTransactionDescription(tx),
			createdAt: tx.createdAt,
		}));
	}

	private buildTransactionDescription(tx: Transaction): string {
		const source = tx.metadata?.source as string | undefined;
		const reason = tx.metadata?.reason as string | undefined;
		const isBonus = source === 'bonus' || source === 'promo' || source === 'referral';

		if (isBonus) return reason || 'Bonus Credit';
		if (source === 'temporal-booking') return reason || 'Ride Payment';
		if (source === 'paystack') {
			return tx.type === TransactionType.CREDIT ? 'Top-up via Paystack' : 'Payment via Paystack';
		}
		if (source) {
			return `${tx.type === TransactionType.CREDIT ? 'Top-up' : 'Payment'} via ${source}`;
		}
		return tx.type === TransactionType.CREDIT ? 'Wallet Credit' : 'Wallet Debit';
	}
}
