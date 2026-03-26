import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // TypeScript errors are now fixed - remove ignoreBuildErrors
    // ignoreBuildErrors: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
