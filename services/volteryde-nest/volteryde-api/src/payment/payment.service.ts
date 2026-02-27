import {
	Injectable,
	Logger,
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
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
				reference: response.data.data.reference,
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
		// 1. Verify Signature
		const hash = crypto
			.createHmac('sha512', this.paystackSecretKey)
			.update(JSON.stringify(payload))
			.digest('hex');

		if (hash !== signature) {
			this.logger.error('Invalid webhook signature');
			throw new BadRequestException('Invalid signature');
		}

		const { event, data } = payload;

		// 2. Handle 'charge.success'
		if (event === 'charge.success') {
			return this.processSuccessfulCharge(data);
		}

		return { status: 'ignored', message: 'Event not handled' };
	}

	/**
	 * Process successful charge atomically.
	 */
	private async processSuccessfulCharge(data: any) {
		const reference = data.reference;
		const amountPaid = data.amount / 100; // Convert back to main currency unit

		this.logger.log(`Processing successful charge for reference: ${reference}`);

		// Use a transaction to ensure atomicity
		return await this.dataSource.manager.transaction(async (manager: EntityManager) => {
			// 1. Find the transaction record with lock
			// Note: We need to find the transaction first. Locking via findOne with lock mode 'pessimistic_write'
			// requires a defined repository or query builder within the transaction manager.

			const transactionRecord = await manager.findOne(Transaction, {
				where: { reference },
				relations: ['wallet'],
				lock: { mode: 'pessimistic_write' }, // Prevent concurrent updates
			});

			if (!transactionRecord) {
				this.logger.error(`Transaction with reference ${reference} not found`);
				// If not found, we can't credit. This is a critical error or a transaction initialized outside our system.
				return;
			}

			// 2. Idempotency Check
			if (transactionRecord.status === TransactionStatus.SUCCESS) {
				this.logger.log(`Transaction ${reference} already processed`);
				return { status: 'success', message: 'Already processed' };
			}

			// 3. Verify Amount
			// Allow for small floating point differences, though strict equality is better for financial data.
			if (Math.abs(transactionRecord.amount - amountPaid) > 0.01) {
				this.logger.warn(`Amount mismatch: Expected ${transactionRecord.amount}, Got ${amountPaid}`);
				// Potential fraud or partial payment?
				transactionRecord.status = TransactionStatus.FAILED;
				transactionRecord.metadata = { ...transactionRecord.metadata, failureReason: 'Amount mismatch' };
				await manager.save(transactionRecord);
				return;
			}

			// 4. Update Transaction Status
			transactionRecord.status = TransactionStatus.SUCCESS;
			transactionRecord.externalReference = data.id.toString(); // Paystack ID
			transactionRecord.metadata = { ...transactionRecord.metadata, paystackData: data };
			await manager.save(transactionRecord);

			// 5. Credit Wallet
			const wallet = transactionRecord.wallet;
			// Re-fetch wallet with lock to ensure atomic balance update if needed (though transaction record lock helps)
			// Or just direct update.
			// Better to lock wallet too if multiple transactions can happen for same user same time.
			const lockedWallet = await manager.findOne(Wallet, {
				where: { id: wallet.id },
				lock: { mode: 'pessimistic_write' },
			});

			// We explicitly cast to number because TypeORM returns decimal as string sometimes
			const currentBalance = Number(lockedWallet.balance);
			const newBalance = currentBalance + amountPaid;

			lockedWallet.balance = newBalance;
			await manager.save(lockedWallet);

			this.logger.log(`Wallet credited for user ${lockedWallet.userId}. New balance: ${newBalance}`);
		});
	}

	async getWalletBalance(userId: string) {
		const wallet = await this.walletRepository.findOne({ where: { userId } });
		return wallet ? wallet.balance : 0;
	}
}
