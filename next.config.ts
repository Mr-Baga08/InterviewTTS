import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enhanced experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverComponentsExternalPackages: ["firebase-admin"],
  },

  // Fix for Node.js polyfills in client
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix Buffer polyfill issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: false, // Disable Node.js Buffer polyfill
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
      };
    }

    // Add custom webpack config if needed
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Enhanced caching configuration
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control", 
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
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
    formats: ["image/webp", "image/avif"],
  },

  // Enhanced build output configuration
  output: "standalone",
  
  // Disable telemetry for privacy
  telemetry: false,
};

export default nextConfig;