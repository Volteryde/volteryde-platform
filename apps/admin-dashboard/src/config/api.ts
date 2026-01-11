/**
 * Centralized API Configuration
 * 
 * All service URLs are configured here from environment variables.
 * Change the .env.local file to update all API endpoints at once.
 */

// Service URLs from environment
export const API_CONFIG = {
	// User Management Service - handles user CRUD, profiles, roles
	// Service runs at /api/user-management context path
	userService: {
		baseUrl: process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8083',
		basePath: '/api/user-management',
	},

	// Auth Service - handles authentication, tokens
	authService: {
		baseUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8081',
		basePath: '/api/auth',
	},

	// Payment Service - handles wallets, transactions
	paymentService: {
		baseUrl: process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:8084',
		basePath: '/api/payment',
	},

	// API Gateway - for production use, routes to all services
	gateway: {
		baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8082',
	},
} as const;

/**
 * Get the full URL for a specific service
 */
export function getServiceUrl(service: keyof typeof API_CONFIG): string {
	const config = API_CONFIG[service];
	if ('basePath' in config) {
		return `${config.baseUrl}${config.basePath}`;
	}
	return config.baseUrl;
}

/**
 * Environment mode helpers
 */
export const ENV = {
	isDevelopment: process.env.NODE_ENV === 'development',
	isProduction: process.env.NODE_ENV === 'production',
	isTest: process.env.NODE_ENV === 'test',
} as const;

export default API_CONFIG;
