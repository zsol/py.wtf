/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
    emotion: true, // For advanced Emotion features
  },
  experimental: {
    largePageDataBytes: 1024 * 1024,
  },
};

module.exports = nextConfig;
