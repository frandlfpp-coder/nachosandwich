/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lucide-react'],
  experimental: {
    turbo: {
      root: '..',
    },
  },
};
export default nextConfig;
