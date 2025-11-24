import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Désactiver l'optimisation Vercel (limite gratuite atteinte - erreur 402)
    // Les images sont servies directement depuis Supabase Storage et TMDB
    unoptimized: true,
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
