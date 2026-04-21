import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    // Preview panel domains
    'space.z.ai',
    // Server IP (used by agent-browser in sandbox)
    '21.0.9.242',
  ],
};

export default nextConfig;
