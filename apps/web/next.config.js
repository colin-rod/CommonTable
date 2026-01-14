/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@commontable/types', '@commontable/api-client'],
  typedRoutes: true,
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../..'),
};

module.exports = nextConfig;
