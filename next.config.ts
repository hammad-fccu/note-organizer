import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer, webpack }) => {
    // Add a copy plugin to copy the PDF.js worker to a known location in the public directory
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Override pdf.js dist with the custom built version
        "pdfjs-dist": require.resolve('pdfjs-dist'),
      };
    }
    
    return config;
  },
};

export default nextConfig;
