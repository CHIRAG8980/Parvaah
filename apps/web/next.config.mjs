/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@landslide/ui', '@landslide/types', '@landslide/config'],
  reactStrictMode: true,
};

export default nextConfig;
