import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/ask": ["./data/shop.db"] },
};

export default nextConfig;
