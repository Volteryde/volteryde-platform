/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: { unoptimized: true },
    transpilePackages: ['@volteryde/config']
};

export default nextConfig;
