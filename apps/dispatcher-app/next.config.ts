import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@volteryde/config'],
  reactCompiler: true,
};

export default nextConfig;
