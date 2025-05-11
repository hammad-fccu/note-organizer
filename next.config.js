/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle anki-apkg-export and its dependencies
    config.module.rules.push({
      test: /node_modules\/anki-apkg-export\/dist\/index\.js$/,
      use: 'null-loader',
    });

    // Add a fallback for sql.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
};

module.exports = nextConfig; 