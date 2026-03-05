import type { NextConfig } from "next";

const buildTime = new Date().toISOString();

const nextConfig: NextConfig = {
    env: {
        BUILD_TIME: buildTime,
    },
};

export default nextConfig;
