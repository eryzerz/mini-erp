import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/contracts", "@repo/common"],
};

export default nextConfig;
