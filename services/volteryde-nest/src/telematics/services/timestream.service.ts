// ============================================================================
// Timestream Service
// ============================================================================
// AWS Timestream client for storing and querying time-series telematics data

import { Injectable, Logger } from '@nestjs/common';
import {
  TimestreamWriteClient,
  WriteRecordsCommand,
  _Record as TimestreamRecord,
  Dimension,
  MeasureValueType,
} from '@aws-sdk/client-timestream-write';
import {
  TimestreamQueryClient,
  QueryCommand,
} from '@aws-sdk/client-timestream-query';
import { ConfigService } from '@nestjs/config';
import * as ngeohash from 'ngeohash';

@Injectable()
export class TimestreamService {
  private readonly logger = new Logger(TimestreamService.name);
  private readonly writeClient: TimestreamWriteClient;
  private readonly queryClient: TimestreamQueryClient;
  private readonly databaseName: string;
  private readonly locationTableName: string;
  private readonly diagnosticsTableName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION', 'us-east-1');

    this.writeClient = new TimestreamWriteClient({ region });
    this.queryClient = new TimestreamQueryClient({ region });

    this.databaseName = this.configService.get('TIMESTREAM_DATABASE', 'volteryde_telematics');
    this.locationTableName = this.configService.get('TIMESTREAM_TABLE_LOCATIONS', 'vehicle_locations');
    this.diagnosticsTableName = this.configService.get('TIMESTREAM_TABLE_DIAGNOSTICS', 'vehicle_diagnostics');
  }

  /**
   * Write vehicle location to Timestream
   */
  async writeLocation(data: {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp?: Date;
    geohash: string; // Add geohash
  }): Promise<void> {
    try {
      const currentTime = (data.timestamp || new Date()).getTime().toString();

      const dimensions: Dimension[] = [
        {
          Name: 'vehicleId',
          Value: data.vehicleId,
        },
        {
          Name: 'geohash', // Add geohash as a dimension
          Value: data.geohash,
        },
      ];

      const records: TimestreamRecord[] = [
        {
          Dimensions: dimensions,
          MeasureName: 'location',
          MeasureValueType: 'MULTI',
          Time: currentTime,
          MeasureValues: [
            { Name: 'latitude', Value: data.latitude.toString(), Type: MeasureValueType.DOUBLE },
            { Name: 'longitude', Value: data.longitude.toString(), Type: MeasureValueType.DOUBLE },
            ...(data.speed !== undefined
              ? [{ Name: 'speed', Value: data.speed.toString(), Type: MeasureValueType.DOUBLE }]
              : []),
            ...(data.heading !== undefined
              ? [{ Name: 'heading', Value: data.heading.toString(), Type: MeasureValueType.DOUBLE }]
              : []),
            ...(data.accuracy !== undefined
              ? [{ Name: 'accuracy', Value: data.accuracy.toString(), Type: MeasureValueType.DOUBLE }]
              : []),
          ],
        },
      ];

      const command = new WriteRecordsCommand({
        DatabaseName: this.databaseName,
        TableName: this.locationTableName,
        Records: records,
      });

      await this.writeClient.send(command);
      this.logger.debug(`Location written for vehicle ${data.vehicleId}`);
    } catch (error) {
      this.logger.error('Failed to write location to Timestream:', error);
      throw error;
    }
  }

  /**
   * Write vehicle diagnostics to Timestream
   */
  async writeDiagnostics(data: {
    vehicleId: string;
    batteryLevel: number;
    batteryTemperature: number;
    motorTemperature: number;
    speed: number;
    odometer: number;
    timestamp?: Date;
  }): Promise<void> {
    try {
      const currentTime = (data.timestamp || new Date()).getTime().toString();

      const dimensions: Dimension[] = [
        {
          Name: 'vehicleId',
          Value: data.vehicleId,
        },
      ];

      const records: TimestreamRecord[] = [
        {
          Dimensions: dimensions,
          MeasureName: 'diagnostics',
          MeasureValueType: 'MULTI',
          Time: currentTime,
          MeasureValues: [
            { Name: 'battery_level', Value: data.batteryLevel.toString(), Type: MeasureValueType.DOUBLE },
            { Name: 'battery_temp', Value: data.batteryTemperature.toString(), Type: MeasureValueType.DOUBLE },
            { Name: 'motor_temp', Value: data.motorTemperature.toString(), Type: MeasureValueType.DOUBLE },
            { Name: 'speed', Value: data.speed.toString(), Type: MeasureValueType.DOUBLE },
            { Name: 'odometer', Value: data.odometer.toString(), Type: MeasureValueType.DOUBLE },
          ],
        },
      ];

      const command = new WriteRecordsCommand({
        DatabaseName: this.databaseName,
        TableName: this.diagnosticsTableName,
        Records: records,
      });

      await this.writeClient.send(command);
      this.logger.debug(`Diagnostics written for vehicle ${data.vehicleId}`);
    } catch (error) {
      this.logger.error('Failed to write diagnostics to Timestream:', error);
      throw error;
    }
  }

  /**
   * Query vehicle location history
   */
  async queryLocationHistory(
    vehicleId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    try {
      const queryString = `
        SELECT 
          vehicleId,
          time,
          measure_value::double as latitude,
          measure_value::double as longitude,
          measure_value::double as speed,
          measure_value::double as heading
        FROM "${this.databaseName}"."${this.locationTableName}"
        WHERE vehicleId = '${vehicleId}'
          AND time BETWEEN from_unixtime(${Math.floor(startTime.getTime() / 1000)})
          AND from_unixtime(${Math.floor(endTime.getTime() / 1000)})
        ORDER BY time DESC
      `;

      const command = new QueryCommand({ QueryString: queryString });
      const response = await this.queryClient.send(command);

      return this.parseQueryResponse(response);
    } catch (error) {
      this.logger.error('Failed to query location history:', error);
      throw error;
    }
  }

  /**
   * Get latest vehicle location
   */
  async getLatestLocation(vehicleId: string): Promise<any | null> {
    try {
      const queryString = `
        SELECT 
          vehicleId,
          time,
          measure_value::row(latitude double, longitude double, speed double, heading double) as location
        FROM "${this.databaseName}"."${this.locationTableName}"
        WHERE vehicleId = '${vehicleId}'
        ORDER BY time DESC
        LIMIT 1
      `;

      const command = new QueryCommand({ QueryString: queryString });
      const response = await this.queryClient.send(command);

      const results = this.parseQueryResponse(response);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error('Failed to get latest location:', error);
      throw error;
    }
  }

  /**
   * Get latest diagnostics
   */
  async getLatestDiagnostics(vehicleId: string): Promise<any | null> {
    try {
      const queryString = `
        SELECT 
          vehicleId,
          time,
          measure_value::row(
            battery_level double,
            battery_temp double,
            motor_temp double,
            speed double,
            odometer double
          ) as diagnostics
        FROM "${this.databaseName}"."${this.diagnosticsTableName}"
        WHERE vehicleId = '${vehicleId}'
        ORDER BY time DESC
        LIMIT 1
      `;

      const command = new QueryCommand({ QueryString: queryString });
      const response = await this.queryClient.send(command);

      const results = this.parseQueryResponse(response);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error('Failed to get latest diagnostics:', error);
      throw error;
    }
  }

  /**
   * Find nearby vehicles using Geohash prefixes
   */
  async findNearbyVehicles(
    latitude: number,
    longitude: number,
    precision: number = 6, // Geohash precision (e.g., 6 for ~610m x 610m)
    timeWindowMinutes: number = 5, // Look for vehicles updated in the last 5 minutes
  ): Promise<any[]> {
    try {
      const geohash = ngeohash.encode(latitude, longitude, precision);
      const neighbors = ngeohash.neighbors(geohash);
      const geohashPrefixes = [geohash, ...neighbors];

      const geohashFilter = geohashPrefixes
        .map((prefix) => `geohash LIKE '${prefix}%'`)
        .join(' OR ');

      const queryString = `
        SELECT DISTINCT
          vehicleId,
          MAX(time) AS latest_time,
          MAX(measure_value::double) FILTER (WHERE measure_name = 'latitude') AS latitude,
          MAX(measure_value::double) FILTER (WHERE measure_name = 'longitude') AS longitude,
          MAX(measure_value::double) FILTER (WHERE measure_name = 'speed') AS speed,
          MAX(measure_value::double) FILTER (WHERE measure_name = 'heading') AS heading,
          MAX(measure_value::double) FILTER (WHERE measure_name = 'accuracy') AS accuracy
        FROM "${this.databaseName}"."${this.locationTableName}"
        WHERE (${geohashFilter})
          AND time BETWEEN ago(${timeWindowMinutes}m) AND now()
        GROUP BY vehicleId
        ORDER BY latest_time DESC
      `;

      const command = new QueryCommand({ QueryString: queryString });
      const response = await this.queryClient.send(command);

      return this.parseQueryResponse(response);
    } catch (error) {
      this.logger.error('Failed to find nearby vehicles:', error);
      throw error;
    }
  }

  /**
   * Parse Timestream query response
   */
  private parseQueryResponse(response: any): any[] {
    const results: any[] = [];

    if (!response.Rows || response.Rows.length === 0) {
      return results;
    }

    const columnInfo = response.ColumnInfo || [];

    response.Rows.forEach((row: any) => {
      const record: any = {};

      row.Data.forEach((data: any, index: number) => {
        const columnName = columnInfo[index]?.Name;
        record[columnName] = data.ScalarValue || data.NullValue;
      });

      results.push(record);
    });

    return results;
  }
}
