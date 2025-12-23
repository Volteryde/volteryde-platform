import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DailyReportDto, DailyReportResponseDto, BatteryStatusResponseDto } from '../dto/fleet-endpoints.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('Fleet - Reports')
@Controller('fleet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FleetReportsController {

	@Post('daily-report')
	@ApiOperation({ summary: 'Submit end-of-day report' })
	@ApiResponse({ status: 201, type: DailyReportResponseDto })
	async submitDailyReport(@Body() dto: DailyReportDto): Promise<DailyReportResponseDto> {
		return {
			report_id: 'mock-report-uuid',
			submitted: true
		};
	}

	@Get('battery-status')
	@ApiOperation({ summary: 'Get battery levels for all assigned buses' })
	@ApiQuery({ name: 'threshold', required: false, description: 'Optional percentage filter' })
	@ApiResponse({ status: 200, type: BatteryStatusResponseDto })
	async getBatteryStatus(@Query('threshold') threshold?: string): Promise<BatteryStatusResponseDto> {
		return {
			buses: [
				{ vehicle_id: 'VEH-001', battery_level: 85 },
				{ vehicle_id: 'VEH-002', battery_level: 42 }
			],
			low_battery_count: 0
		};
	}
}
