import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const dbConfig = {
					host: configService.get<string>('database.host'),
					port: configService.get<number>('database.port'),
					username: configService.get<string>('database.username'),
					password: configService.get<string>('database.password'),
					database: configService.get<string>('database.name'),
				};
				console.log('DB Connection Config:', dbConfig);
				return {
					type: 'postgres',
					...dbConfig,
					password: process.env.DATABASE_PASSWORD || 'postgres',
					database: process.env.DATABASE_NAME || 'volteryde',
					autoLoadEntities: true,
					synchronize: process.env.NODE_ENV !== 'production',
					logging: true,
				};
			},
		}),
	],
	exports: [TypeOrmModule],
})
export class DatabaseModule { }
