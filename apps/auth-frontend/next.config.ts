/** @type {import('next').NextConfig} */

const securityHeaders = [
	{ key: 'X-DNS-Prefetch-Control', value: 'on' },
	{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
	{ key: 'X-Frame-Options', value: 'DENY' }, // auth page should never be iframed
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
	{ key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig = {
	output: 'standalone',
	reactStrictMode: true,
	env: {
		AUTH_API_URL: process.env.AUTH_API_URL || 'http://localhost:8081',
	},
	transpilePackages: ['@volteryde/config'],
	async headers() {
		return [{ source: '/(.*)', headers: securityHeaders }];
	},
};

export default nextConfig;
