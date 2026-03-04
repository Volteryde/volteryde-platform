import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@volteryde/config'],
  reactCompiler: true,
};

export default nextConfig;
