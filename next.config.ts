import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/webnn',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
