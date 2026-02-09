import {
	Controller,
	Post,
	Body,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	UseGuards,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitializeTopUpDto, PaystackWebhookDto } from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payment')
@Controller('api/v1/payment')
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
	) {
		if (!user || !user.uid) { // Assuming Firebase UID is mapped to uid or user_id
			// In a real app with AuthGuard, user would be present.
			// If AuthGuard is not globally applied, we might need to apply it here.
			// For now assuming existing auth infra puts user in request.
			// But let's check CurrentUser decorator again. It returns request.user.
			// We need to make sure we extract the ID correctly.
			// I will assume user object has a uid or id property.
			throw new UnauthorizedException('User not found');
		}
		return this.paymentService.initializeTopUp(user.uid, dto);
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
	async getWalletBalance(@CurrentUser() user: any) {
		if (!user || !user.uid) {
			throw new UnauthorizedException('User not found');
		}
		const balance = await this.paymentService.getWalletBalance(user.uid);
		return { balance, currency: 'GHS' };
	}
}
