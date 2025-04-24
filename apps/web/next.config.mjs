/** @type {import('next').NextConfig} */
import webpack from 'webpack';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    // Handle node: protocol imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:process': 'process/browser',
      'node:stream': 'stream-browserify',
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:url': 'url',
      'node:crypto': 'crypto-browserify',
    };

    // Only apply fallbacks for client-side and edge (middleware) bundles
    if (!isServer || config.name === 'edge') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
      };

      // Add plugins to provide process and buffer
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
