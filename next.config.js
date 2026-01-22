// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: undefined, // ← Désactive le static export
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
module.exports = nextConfig;