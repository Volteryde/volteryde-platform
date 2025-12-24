import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class GpsLocationDto {
	@ApiProperty({ example: 5.6037 })
	@IsNumber()
	@Min(-90)
	@Max(90)
	latitude: number;

	@ApiProperty({ example: -0.1870 })
	@IsNumber()
	@Min(-180)
	@Max(180)
	longitude: number;

	@ApiPropertyOptional({ example: 'Accra Mall' })
	@IsOptional()
	@IsString()
	address?: string;
}

export enum VehicleType {
	STANDARD = 'STANDARD',
	PREMIUM = 'PREMIUM',
	SHUTTLE = 'SHUTTLE',
}

export class CreateBookingDto {
	@ApiProperty({ description: 'User ID requesting the ride' })
	@IsString()
	userId: string;

	@ApiProperty({ description: 'Pickup location' })
	@ValidateNested()
	@Type(() => GpsLocationDto)
	startLocation: GpsLocationDto;

	@ApiProperty({ description: 'Dropoff location' })
	@ValidateNested()
	@Type(() => GpsLocationDto)
	endLocation: GpsLocationDto;

	@ApiPropertyOptional({ enum: VehicleType, default: VehicleType.STANDARD })
	@IsOptional()
	@IsEnum(VehicleType)
	vehicleType?: VehicleType;

	@ApiPropertyOptional({ description: 'Scheduled time' })
	@IsOptional()
	@IsDateString()
	scheduledTime?: string;

	@ApiPropertyOptional({ description: 'Number of passengers', default: 1 })
	@IsOptional()
	@IsNumber()
	passengerCount?: number;
}
