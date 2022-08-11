/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    largePageDataBytes: 1024 * 1024,
  },
  rewrites: async () => [
    {
      source: "/:any*",
      destination: "/_spa",
    },
  ],
};

module.exports = nextConfig;
