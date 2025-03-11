import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Disables ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignores TypeScript errors during build
  },
};

export default nextConfig;
