import configuration from '../../src/config/configuration';

describe('Configuration', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	it('should return default values when env vars are missing', () => {
		const config = configuration();
		expect(config.port).toBe(3000);
		expect(config.database.host).toBe('localhost');
		expect(config.database.port).toBe(5432);
		expect(config.nodeEnv).toBe('test');
	});

	it('should return env values when present', () => {
		process.env.PORT = '4000';
		process.env.DATABASE_HOST = 'db-host';
		process.env.DATABASE_PORT = '5433';
		process.env.NODE_ENV = 'production';

		const config = configuration();
		expect(config.port).toBe(4000);
		expect(config.database.host).toBe('db-host');
		expect(config.database.port).toBe(5433);
		expect(config.nodeEnv).toBe('production');
	});
});
