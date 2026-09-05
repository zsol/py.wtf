const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

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
  output: "export",
};

module.exports = (phase) => ({
  ...nextConfig,
  // Production routing is handled by public/404.html on the static host.
  ...(phase === PHASE_DEVELOPMENT_SERVER
    ? {
        rewrites: async () => [
          {
            source: "/:any*",
            destination: "/_spa",
          },
        ],
      }
    : {}),
});
