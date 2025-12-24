import { ApiProperty } from '@nestjs/swagger';

export class InitiateChargingDto {
	@ApiProperty({ example: 'uuid', description: 'Vehicle ID' })
	vehicle_id: string;

	@ApiProperty({ example: 'uuid', description: 'Station ID' })
	station_id: string;

	@ApiProperty({ example: 45, description: 'Expected duration in minutes' })
	expected_duration: number;
}

export class InitiateChargingResponseDto {
	@ApiProperty()
	session_id: string;

	@ApiProperty()
	charging_started: boolean;
}

export class DailyReportDto {
	@ApiProperty()
	report_date: string;

	@ApiProperty()
	total_buses_assigned: number;

	@ApiProperty()
	buses_returned: number;

	@ApiProperty()
	buses_absent: number;

	@ApiProperty()
	buses_inspected: number;

	@ApiProperty()
	issues_reported: number;

	@ApiProperty()
	summary: string;
}

export class DailyReportResponseDto {
	@ApiProperty()
	report_id: string;

	@ApiProperty()
	submitted: boolean;
}

export class BatteryStatusResponseDto {
	@ApiProperty({ type: [Object] })
	buses: Array<{ vehicle_id: string; battery_level: number }>;

	@ApiProperty()
	low_battery_count: number;
}
