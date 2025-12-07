import type { NextConfig } from 'next'
import path from 'path'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

const nextConfig: NextConfig = {
  experimental: {
    mdxRs: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
}

export default withMDX(nextConfig)