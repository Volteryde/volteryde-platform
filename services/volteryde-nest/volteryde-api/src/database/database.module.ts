import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';

export function createTypeOrmOptions(configService: ConfigService) {
	const host = configService.get<string>('database.host');
	const port = configService.get<number>('database.port');
	const username = configService.get<string>('database.username');
	const password = configService.get<string>('database.password');
	const database = configService.get<string>('database.name');
	const schema = configService.get<string>('database.schema') || 'public';

	const dbConfig = {
		host,
		port,
		username,
		password,
		database,
	};
	console.log('DB Connection Config:', dbConfig);

	const sslMode = process.env.PGSSLMODE;
	const shouldEnableSsl = sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full';
	const sslCaPath = process.env.DATABASE_SSL_CA_PATH || process.env.PGSSLROOTCERT;

	let sslCa: string | undefined;
	if (shouldEnableSsl && sslCaPath) {
		try {
			sslCa = readFileSync(sslCaPath, 'utf8');
		} catch {
			sslCa = undefined;
		}
	}

	return {
		type: 'postgres' as const,
		...dbConfig,
		autoLoadEntities: true,
		schema,
		synchronize: process.env.DATABASE_SYNCHRONIZE === 'true', // Configurable for initial setup
		logging: true,
		...(shouldEnableSsl
			? {
				ssl: {
					rejectUnauthorized: true,
					...(sslCa ? { ca: sslCa } : {}),
				},
			}
			: {}),
	};
}

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return createTypeOrmOptions(configService);
			},
		}),
	],
	exports: [TypeOrmModule],
})
export class DatabaseModule { }
