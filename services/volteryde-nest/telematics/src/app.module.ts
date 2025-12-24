import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { TemporalModule } from './shared/temporal/temporal.module';
import { TelematicsModule } from './telematics/telematics.module';
import { FirebaseModule } from './firebase/firebase.module';
import { RootController } from './root.controller';

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
    TelematicsModule,
    FirebaseModule,
  ],
  controllers: [RootController],
  providers: [],
})
export class AppModule { }
