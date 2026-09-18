/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  transpilePackages: ['@landslide/ui', '@landslide/types', '@landslide/config'],
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
