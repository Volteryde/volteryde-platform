import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { createTypeOrmOptions } from '../../src/database/database.module';

describe('DatabaseModule (TypeORM options)', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	function mockConfigService(values: Record<string, unknown>): ConfigService {
		return {
			get: (key: string) => values[key],
		} as unknown as ConfigService;
	}

	it('should set ssl.ca and ssl.rejectUnauthorized=true when PGSSLMODE=require and CA path is provided', () => {
		process.env.PGSSLMODE = 'require';
		const caPem = '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n';
		const caPath = join(tmpdir(), `rds-ca-${Date.now()}.pem`);
		writeFileSync(caPath, caPem);
		process.env.DATABASE_SSL_CA_PATH = caPath;

		const configService = mockConfigService({
			'database.host': 'volteryde-prod-postgres.cbucoeyea98s.sa-east-1.rds.amazonaws.com',
			'database.port': 5432,
			'database.username': 'volteryde_admin',
			'database.password': 'password',
			'database.name': 'volteryde',
			'database.schema': 'public',
		});

		const options = createTypeOrmOptions(configService);
		expect(options.ssl).toEqual({ rejectUnauthorized: true, ca: caPem });
	});

	it('should set ssl.rejectUnauthorized=true when PGSSLMODE=require and CA path is not provided', () => {
		process.env.PGSSLMODE = 'require';
		delete process.env.DATABASE_SSL_CA_PATH;

		const configService = mockConfigService({
			'database.host': 'postgres.default.svc.cluster.local',
			'database.port': 5432,
			'database.username': 'postgres',
			'database.password': 'password',
			'database.name': 'volteryde',
		});

		const options = createTypeOrmOptions(configService);
		expect(options.ssl).toEqual({ rejectUnauthorized: true });
	});

	it('should not set ssl options when PGSSLMODE is not a TLS mode', () => {
		delete process.env.PGSSLMODE;
		delete process.env.DATABASE_SSL_CA_PATH;

		const configService = mockConfigService({
			'database.host': 'volteryde-prod-postgres.cbucoeyea98s.sa-east-1.rds.amazonaws.com',
			'database.port': 5432,
			'database.username': 'volteryde_admin',
			'database.password': 'password',
			'database.name': 'volteryde',
		});

		const options = createTypeOrmOptions(configService);
		expect(options.ssl).toBeUndefined();
	});
});
