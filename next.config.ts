// 5. next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint:{
    ignoreDuringBuilds: true,
  },
  typescript:{
    ignoreBuildErrors: true,
  },
  // Enable experimental features if needed
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        port: "",
        pathname: "/gh/devicons/devicon/icons/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/devicons/devicon/master/icons/**",
      },
    ],
  },

  // Webpack configuration for better performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack config if needed
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;