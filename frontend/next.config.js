/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  typescript: {
    // Skip type checking during build for production
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build for production
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
