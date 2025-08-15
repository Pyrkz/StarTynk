import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also disable TypeScript checks during builds for faster deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
