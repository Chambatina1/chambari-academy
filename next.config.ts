import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Disable all caching for development ease
  experimental: {
    cpus: 1,
  },
  async headers() {
    return [{
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    }, {
      source: '/',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    }];
  },
};

export default nextConfig;
