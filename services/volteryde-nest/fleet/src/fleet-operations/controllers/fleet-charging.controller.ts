import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InitiateChargingDto, InitiateChargingResponseDto } from '../dto/fleet-endpoints.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('Fleet - Charging')
@Controller('fleet/charging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FleetChargingController {

	@Post('initiate')
	@ApiOperation({ summary: 'Initiate charging for electric bus' })
	@ApiResponse({ status: 201, type: InitiateChargingResponseDto })
	async initiateCharging(@Body() dto: InitiateChargingDto): Promise<InitiateChargingResponseDto> {
		// Logic would go here (call Charging Service via gRPC/HTTP or internal service)
		// For now returning mock response as per implementation plan pattern
		return {
			session_id: 'mock-session-uuid',
			charging_started: true
		};
	}
}
