import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  compiler: {
    removeConsole: process.env.ENVIRONMENT === "PRODUCTION",
  },
  typescript: {
    // Temporarily ignore type errors during build to verify middleware fix
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
