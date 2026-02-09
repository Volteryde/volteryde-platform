import { IsNumber, Min, IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializeTopUpDto {
	@ApiProperty({ description: 'Amount to top up in GHS', minimum: 12 })
	@IsNumber()
	@Min(12, { message: 'Minimum valid amount is 12 GHS' })
	amount: number;

	@ApiProperty({ description: 'User email for receipt', required: false })
	@IsOptional()
	@IsEmail()
	email?: string;
}

export class PaystackWebhookDto {
	@IsString()
	event: string;

	@IsNotEmpty()
	data: any;
}
