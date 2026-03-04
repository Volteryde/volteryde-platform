import {
	Controller,
	Post,
	Body,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	UnauthorizedException,
	Logger,
	Query,
	Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitializeTopUpDto, PaystackWebhookDto } from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
	private readonly logger = new Logger(PaymentController.name);

	constructor(private readonly paymentService: PaymentService) { }

	@Post('topup')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Initialize a wallet top-up transaction' })
	@ApiResponse({ status: 201, description: 'Transaction initialized', schema: { example: { authorizationUrl: 'https://...', reference: '...' } } })
	@ApiResponse({ status: 400, description: 'Invalid amount (min 12 GHS)' })
	async initializeTopUp(
		@CurrentUser() user: any,
		@Body() dto: InitializeTopUpDto,
		@Req() req: Request,
	) {
		const userId = this.resolveUserId(user, req);
		return this.paymentService.initializeTopUp(userId, dto);
	}

	@Post('webhook')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Paystack webhook endpoint' })
	async handleWebhook(
		@Headers('x-paystack-signature') signature: string,
		@Body() payload: PaystackWebhookDto, // Using DTO might be strict for loose payload, keeping 'any' in service
	) {
		// We pass the raw body if possible or just the payload object if body parser is already running.
		// NestJS ParseBody usually gives object.
		// Signature verification needs raw body string usually, but if we trust Paystack to send JSON,
		// JSON.stringify(payload) might differ from raw bytes if spacing differs.
		// However, without RawBody buffer, we have to rely on payload.
		// The service uses JSON.stringify(payload).
		return this.paymentService.handleWebhook(signature, payload);
	}

	@Get('wallet')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get current wallet balance' })
	@ApiResponse({ status: 200, description: 'Wallet balance retrieved' })
	async getWalletBalance(@CurrentUser() user: any, @Req() req: Request) {
		const userId = this.resolveUserId(user, req);
		const balance = await this.paymentService.getWalletBalance(userId);
		const numBalance = Number(balance) || 0;
		return {
			customerId: userId,
			realBalance: numBalance,
			promoBalance: 0,
			totalBalance: numBalance,
			currency: 'GHS',
		};
	}

	@Get('transactions')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get wallet transaction history' })
	@ApiResponse({ status: 200, description: 'Transaction history retrieved' })
	async getTransactions(
		@CurrentUser() user: any,
		@Req() req: Request,
		@Query('limit') limit?: string,
	) {
		const userId = this.resolveUserId(user, req);
		const maxResults = Math.min(parseInt(limit, 10) || 50, 100);
		return this.paymentService.getTransactionHistory(userId, maxResults);
	}

	/**
	 * Resolve user ID from CurrentUser decorator or X-User-Id header fallback.
	 */
	private resolveUserId(user: any, req: Request): string {
		if (user?.uid) return user.uid;
		if (user?.id) return user.id;
		const headerUserId = req.headers['x-user-id'] as string;
		if (headerUserId) return headerUserId;
		throw new UnauthorizedException('User not found');
	}
}
