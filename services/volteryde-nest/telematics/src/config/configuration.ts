/**
 * Application configuration
 * SECURITY: JWT_SECRET must be set in production environments
 */
export default () => {
	const nodeEnv = process.env.NODE_ENV || 'development';
	const jwtSecret = process.env.JWT_SECRET;

	// Fail fast in production if JWT_SECRET is not configured
	if (nodeEnv === 'production' && !jwtSecret) {
		throw new Error('JWT_SECRET environment variable must be set in production');
	}

	return {
		port: parseInt(process.env.PORT, 10) || 3000,
		database: {
			host: process.env.DATABASE_HOST || 'localhost',
			port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
			username: process.env.DATABASE_USERNAME || 'postgres',
			password: process.env.DATABASE_PASSWORD || 'postgres',
			name: process.env.DATABASE_NAME || 'volteryde',
			schema: process.env.DATABASE_SCHEMA || 'public',
		},
		jwt: {
			// Use env var or development-only fallback
			secret: jwtSecret || (nodeEnv !== 'production' ? 'dev-secret-do-not-use-in-prod' : undefined),
			expiresIn: process.env.JWT_EXPIRES_IN || '60s',
		},
		nodeEnv,
	};
};
