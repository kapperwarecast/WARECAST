import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // OPTIMIZATION: Restreindre remotePatterns pour sécurité et performance
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // OPTIMIZATION: Réduire deviceSizes pour moins de variants générés
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // OPTIMIZATION: Augmenter cache TTL à 24h
    minimumCacheTTL: 86400,
  },

  // OPTIMIZATION: Retirer console.log en production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // OPTIMIZATION: Optimiser imports de packages volumineux
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
