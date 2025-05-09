// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // When exporting a static site, trailingSlash ensures that URLs have a trailing slash.
  trailingSlash: true,
  
  // Comment out basePath if you're getting 404s
  // basePath: '/schematic',
  
  // Add webpack configuration to handle Node.js modules
  webpack: (config) => {
    // Handle modules that try to use Node.js specific modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;