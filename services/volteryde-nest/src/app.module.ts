import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { TemporalModule } from './shared/temporal/temporal.module';
import { BookingModule } from './booking/booking.module';
import { TelematicsModule } from './telematics/telematics.module';
// TODO: Import when created
// import { FleetOperationsModule } from './fleet-operations/fleet-operations.module';
// import { ChargingInfrastructureModule } from './charging-infrastructure/charging-infrastructure.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // Use central .env from monorepo root
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'volteryde'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),
    TemporalModule,
    HealthModule,
    BookingModule,
    TelematicsModule,
    // FleetOperationsModule, // TODO: Uncomment when created
    // ChargingInfrastructureModule, // TODO: Uncomment when created
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
