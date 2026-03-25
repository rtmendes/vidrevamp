/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: '**.ggpht.com' },
    ],
  },
  eslint: {
    // Treat no-img-element as warning only — we use external URLs for mock data
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
