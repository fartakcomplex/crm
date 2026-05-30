import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    // Preview panel domains — use wildcard patterns
    'space.z.ai',
    '21.0.9.242',
    '21.0.22.203',
    '127.0.0.1',
    // Allow all preview-chat subdomains
    '*.space.z.ai',
    '*.space-z.ai',
  ],
};

export default nextConfig;
