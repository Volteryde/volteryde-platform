import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NearbyVehiclesQueryDto {
  @ApiProperty({
    description: 'Latitude coordinate of the center point for the search',
    example: 5.6037,
    minimum: -90,
    maximum: 90,
    type: Number,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of the center point for the search',
    example: -0.187,
    minimum: -180,
    maximum: 180,
    type: Number,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Geohash precision (1-12). Higher precision means smaller search area. Default is 6.',
    example: 6,
    minimum: 1,
    maximum: 12,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  precision?: number;

  @ApiProperty({
    description: 'Time window in minutes to consider for recent vehicle locations. Default is 5 minutes.',
    example: 5,
    minimum: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeWindowMinutes?: number;
}
