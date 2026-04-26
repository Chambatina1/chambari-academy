import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
