// ============================================================================
// Start Session DTO
// ============================================================================
// Input validation for starting a charging session

import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ example: 'CHG-001' })
  @IsString()
  stationId: string;

  @ApiProperty({ example: '1' })
  @IsString()
  connectorId: string;

  @ApiProperty({ example: 'USR-001' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'VEH-001' })
  @IsString()
  vehicleId: string;
}
