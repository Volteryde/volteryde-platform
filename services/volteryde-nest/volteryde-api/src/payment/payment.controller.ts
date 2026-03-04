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
	Res,
	Param,
	UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitializeTopUpDto, PaystackWebhookDto } from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InternalServiceGuard } from '../shared/guards/internal-service.guard';

@ApiTags('wallet')
@Controller('wallet')
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

	// Austin: Paystack redirects here after payment completion. Since the checkout
	// opens in SFSafariViewController (expo-web-browser), we return a simple HTML
	// page telling the user to close the browser. The actual balance update happens
	// via the Paystack webhook — this is purely a UX landing page.
	@Get('callback')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Paystack payment callback (redirect after checkout)' })
	async paymentCallback(
		@Query('trxref') trxref: string,
		@Query('reference') reference: string,
		@Res() res: Response,
	) {
		this.logger.log(`Payment callback received — trxref: ${trxref}, reference: ${reference}`);
		res.setHeader('Content-Type', 'text/html');
		res.send(`
			<!DOCTYPE html>
			<html>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Payment Complete</title>
				<style>
					body { font-family: -apple-system, system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
					.card { background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 360px; }
					.check { font-size: 48px; margin-bottom: 16px; }
					h2 { color: #1a1a1a; margin: 0 0 8px; }
					p { color: #666; margin: 0 0 20px; font-size: 14px; }
					.ref { font-size: 12px; color: #999; word-break: break-all; }
				</style>
			</head>
			<body>
				<div class="card">
					<div class="check">✅</div>
					<h2>Payment Successful</h2>
					<p>Your wallet will be credited shortly.<br/>You can close this window now.</p>
					<div class="ref">Ref: ${reference || trxref || 'N/A'}</div>
				</div>
			</body>
			</html>
		`);
	}

	@Get('balance')
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

	// ─── Internal Wallet Endpoints (Temporal Workers) ─────────────────────────

	@Get('internal/:userId/balance')
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async internalGetBalance(@Param('userId') userId: string) {
		return this.paymentService.internalGetBalance(userId);
	}

	@Post('internal/deduct')
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async internalDeduct(
		@Body() body: { userId: string; amount: number; referenceId: string; reason: string },
	) {
		return this.paymentService.internalDeduct(
			body.userId,
			body.amount,
			body.referenceId,
			body.reason,
		);
	}

	@Post('internal/credit')
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async internalCredit(
		@Body() body: { userId: string; amount: number; referenceId: string; reason: string },
	) {
		return this.paymentService.internalCredit(
			body.userId,
			body.amount,
			body.referenceId,
			body.reason,
		);
	}

	@Post('internal/refund')
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async internalRefund(
		@Body() body: { userId: string; amount: number; originalReferenceId: string; reason: string },
	) {
		return this.paymentService.internalRefund(
			body.userId,
			body.amount,
			body.originalReferenceId,
			body.reason,
		);
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
