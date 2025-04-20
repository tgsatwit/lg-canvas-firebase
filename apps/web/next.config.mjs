/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        process: false,
        stream: false,
        util: false,
        buffer: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
