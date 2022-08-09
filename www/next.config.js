/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    largePageDataBytes: 1024 * 1024,
  },
};

module.exports = nextConfig;
