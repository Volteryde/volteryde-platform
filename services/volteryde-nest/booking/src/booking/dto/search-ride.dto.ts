import { IsNumber, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchRideDto {
	@ApiProperty({ description: 'Start latitude', example: 5.6037 })
	@IsNumber()
	@Min(-90)
	@Max(90)
	startLat: number;

	@ApiProperty({ description: 'Start longitude', example: -0.1870 })
	@IsNumber()
	@Min(-180)
	@Max(180)
	startLon: number;

	@ApiProperty({ description: 'Destination latitude', example: 5.6200 })
	@IsNumber()
	@Min(-90)
	@Max(90)
	endLat: number;

	@ApiProperty({ description: 'Destination longitude', example: -0.1900 })
	@IsNumber()
	@Min(-180)
	@Max(180)
	endLon: number;

	@ApiPropertyOptional({ description: 'Scheduled pickup time' })
	@IsOptional()
	@IsDateString()
	scheduledTime?: string;
}
