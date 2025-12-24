import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { TemporalModule } from './shared/temporal/temporal.module';

import { ChargingInfrastructureModule } from './charging-infrastructure/charging-infrastructure.module';
import { FirebaseModule } from './firebase/firebase.module'; // Import FirebaseModule
import { RootController } from './root.controller'; // Import RootController

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
    HealthModule,
    ChargingInfrastructureModule,
    FirebaseModule,
  ],
  controllers: [RootController],
  providers: [],
})
export class AppModule { }
