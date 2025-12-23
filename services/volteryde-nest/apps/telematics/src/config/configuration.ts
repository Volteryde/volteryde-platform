export default () => ({
	port: parseInt(process.env.PORT, 10) || 3000,
	database: {
		host: process.env.DATABASE_HOST || 'localhost',
		port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
		username: process.env.DATABASE_USERNAME || 'postgres',
		password: process.env.DATABASE_PASSWORD || 'postgres',
		name: process.env.DATABASE_NAME || 'volteryde',
	},
	jwt: {
		secret: process.env.JWT_SECRET || 'secretKey',
		expiresIn: process.env.JWT_EXPIRES_IN || '60s',
	},
	nodeEnv: process.env.NODE_ENV || 'development',
});
