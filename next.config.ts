import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const githubBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "/GGW-Academy";

const nextConfig: NextConfig = {
  ...(githubPages
    ? {
        output: "export" as const,
        assetPrefix: `${githubBasePath}/`,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
