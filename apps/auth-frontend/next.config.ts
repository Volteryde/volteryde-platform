/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	reactStrictMode: true,
	env: {
		AUTH_API_URL: process.env.AUTH_API_URL || 'http://localhost:8081',
	},
};

export default nextConfig;
