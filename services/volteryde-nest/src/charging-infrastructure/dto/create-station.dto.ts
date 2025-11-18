// ============================================================================
// Create Station DTO
// ============================================================================
// Input validation for creating new charging stations

import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ConnectorType } from '../entities/charging-station.entity';

class ConnectorDto {
  @ApiProperty({ example: '1' })
  @IsString()
  connectorId: string;

  @ApiProperty({ enum: ConnectorType, example: ConnectorType.CCS })
  @IsEnum(ConnectorType)
  type: ConnectorType;

  @ApiProperty({ example: 150 })
  @IsNumber()
  powerKw: number;
}

export class CreateStationDto {
  @ApiProperty({ example: 'CHG-001' })
  @IsString()
  stationId: string;

  @ApiProperty({ example: 'Accra Mall Charging Hub' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Tetteh Quarshie Interchange, Accra' })
  @IsString()
  address: string;

  @ApiProperty({ example: 5.6139 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -0.1939 })
  @IsLongitude()
  longitude: number;

  @ApiProperty({ type: [ConnectorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConnectorDto)
  connectors: ConnectorDto[];
}
