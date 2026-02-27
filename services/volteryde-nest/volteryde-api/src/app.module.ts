import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { TemporalModule } from './shared/temporal/temporal.module';
import { BookingModule } from './booking/booking.module';
import { TelematicsModule } from './telematics/telematics.module';
import { FleetOperationsModule } from './fleet-operations/fleet-operations.module';
import { ChargingInfrastructureModule } from './charging-infrastructure/charging-infrastructure.module';
import { FirebaseModule } from './firebase/firebase.module';
import { GtfsModule } from './gtfs/gtfs.module';
import { RootController } from './root.controller';
import { PaymentModule } from './payment/payment.module';
// Austin: H3 geospatial Module - provides hexagonal spatial indexing for dispatch
import { H3GeospatialModule } from '@app/shared/h3';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      load: [configuration],
    }),
    DatabaseModule,
    TemporalModule,
    HealthModule,
    BookingModule,
    TelematicsModule,
    FleetOperationsModule,
    ChargingInfrastructureModule,
    FirebaseModule,
    GtfsModule,
    PaymentModule,
    // Austin: H3 geospatial services for driver tracking, smart snap, and dispatch
    H3GeospatialModule,
  ],
  controllers: [RootController],
  providers: [],
})
export class AppModule { }
