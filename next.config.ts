import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export',
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://backend.tryanon.ai',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'canvas': false
    };
    return config;
  },
};

export default nextConfig;
