/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "chat.vinagpu.com"],
  },
  typescript: {
    // Skip type checking during build for production
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build for production
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Ensure React is properly imported
    esmExternals: false,
  },
  webpack: (config) => {
    // Ensure React is available globally
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
